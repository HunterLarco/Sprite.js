var CanvasApplicationRenderingContext2D = function(ctx){
	var sprites = [],
			allTextures = [];
	/* ----- Prototypes (Constructors) ----- */
	var CanvasApplicationInterval = function(interval,params){
		var self = this,
				undefined;
		var MPFtimecard = Date.now();// milliseconds per frame
				forceQuit = false,
				cooldown = true,
				minMPF = 30,
				previousMPF = 1,
				cycleCount = 0,
				requestAnimationFrame = (function(){// requestAnimationFrame shim
					return window.requestAnimationFrame   ||
						window.webkitRequestAnimationFrame  ||
						window.mozRequestAnimationFrame     ||
						window.oRequestAnimationFrame       ||
						window.msRequestAnimationFrame      ||
					function(callback){
						window.setTimeout(callback,1000/minFPS);
					};
				})();
		function calculateMPF(){
			var MPF = Date.now()-MPFtimecard;
			return MPF;
		};
		function MPF_to_FPS(MPF){
			return 1000/MPF;
		};
		function FPS_to_MPF(FPS){
			return 1000/FPS;
		};
		function threeSigFigs(number){
			return parseFloat(number.toFixed(3));
		};
		function requestAnimationFrameWithCooldown(){
			var MPF = calculateMPF();
			if(cooldown&&MPF<minMPF){
				previousMPF = minMPF;
				setTimeout(Cycle,minMPF-MPF);
			}else{
				previousMPF = MPF;
				requestAnimationFrame(Cycle);
			};
		};
		function Cycle(){
			if(forceQuit){
				forceQuit = false;
			}else{
				MPFtimecard = Date.now();
				interval(self);
				cycleCount++;
				requestAnimationFrameWithCooldown();
			};
		};
		function autoStart(){
			if(!!params){// check autostart
				if(!!params.autoStart&&params.autoStart===true){
					Cycle();
				};
			}else{
				Cycle();
			};
		};
		function interpretParams(){
			if(!!params){
				if(params.cooldown!=undefined&&params.cooldown.constructor===Boolean){
					cooldown = params.cooldown;
				};
				if(!!params.MAX_FPS&&params.MAX_FPS.constructor===Number){
					minMPF = FPS_to_MPF(params.MAX_FPS);
				};
			};
		};
		function createInterval(){
			interval = interval.bind(self);
			self.__defineGetter__('MAX_FPS',function(){return MPF_to_FPS(previousMPF);});
			self.__defineSetter__('MAX_FPS',function(newValue){
				if(newValue.constructor===Number){
					minMPF = FPS_to_MPF(newValue);
				};
				return newValue;
			});
			self.__defineGetter__('COOLDOWN',function(){return cooldown;});
			self.__defineSetter__('COOLDOWN',function(newValue){
				if(newValue.constructor===Boolean){
					cooldown = newValue;
				};
				return newValue;
			});
			self.stop = function(){
				forceQuit = true;
			};
			self.start = Cycle;
			self.__defineGetter__('FPS',function(){
				return threeSigFigs(MPF_to_FPS(previousMPF));
			});
			self.__defineGetter__('CYCLE',function(){
				return cycleCount;
			});
			interpretParams();
			autoStart();
		};
		if(!!interval&&(typeof(interval)).toLowerCase()=='function'){
			createInterval();
		};
	};
	var CanvasApplicationTexture = function(texture){
		var self = this;
		if(!(self instanceof CanvasApplicationTexture)){// forces "new" prefix
			throw new TypeError("DOM object constructor cannot be called as a function.");
		};
		var ImageRendererStack = [];ImageRendererStack.bypass = false;
		var ajax = {
					sample:function(url,callback){// header request
						var xmlhttp = new XMLHttpRequest();
						xmlhttp.open('HEAD',url,false);
						xmlhttp.onreadystatechange = function(event){
							if (xmlhttp.readyState===4){
								if(xmlhttp.status===200){
									var headers = xmlhttp.getAllResponseHeaders().split('\n').slice(0,-1);
									var json = new Object();
									var i=headers.length;while(i--){
										json[headers[i].slice(0,headers[i].indexOf(':'))] = headers[i].slice(headers[i].indexOf('\:')+1).replace(/^\s*/,'');
									};
									callback({status:0,data:json,message:'Success'});
								}else if(xmlhttp.status===404){
									callback({status:-1,message:'File Not Found'});
								}else{
									callback({status:-1,message:'Unknown Resource Error'});
								};
							};
						};
						xmlhttp.send();
					}
				},
				textureOnLoad = new Function();
		switch((typeof(texture)).toLowerCase()){
			case 'function':
				allTextures.push(self);
				createFromFunction();
			break;
			case 'string':
				allTextures.push(self);
				loadImageForTexture();
			break;
			default:
				createInvalidTexture();
		};
		function loadImageForTexture(){
			ajax.sample(texture,function(event){
				if(event.status===0){
					var mimetype = event.data['Content-type'],
							generalMimetype = mimetype.split('/')[0].toLowerCase();
					if(generalMimetype==='image'){
						createFromImage();
					}else{
						console.warn('APPLICATION WARNING: "'+generalMimetype+'" type files are not supported as textures.');
						createInvalidTexture();
					};
				}else{
					console.warn('APPLICATION WARING: unable to retrieve texture file; error code "'+event.message+'".');
					createInvalidTexture();
				};
			});
		};
		function createFromFunction(){
			self.TEXTURE = 1;
			self.TYPE = 0;
			self.RENDERER = texture;
			self.STATE = 1;
		};
		function createFromImage(){
			var img = new Image();
			img.src = texture;
			img.onload = runImageRendererStack;
			self.TEXTURE = 1;
			self.TYPE = 1;
			self.STATE = -1;
			self.__defineGetter__('onload',function(){return textureOnLoad;});
			self.__defineSetter__('onload',function(newValue){
				if((typeof(newValue)).toLowerCase()==='function'){
					textureOnLoad = newValue;
				};
				return textureOnLoad;
			});
			self.RENDERER = function(){
				if(!ImageRendererStack.bypass){// save rendering stack until the file is loaded to draw
					// ImageRendererStack.push(arguments.callee); ~ doesn't save context state so breaks in complex application uses
					console.warn('TEXTURE NOT RENDERED: texture image not yet loaded; "'+texture+'".');
				}else{
					ctx.drawImage(img,0,0);
				};
			};
		};
		function runImageRendererStack(){
			ImageRendererStack.bypass = true;
			for(var i=0,action;action=ImageRendererStack[i++];){
				action();
			};
			self.STATE = 1;
			textureOnLoad();
		};
		function createInvalidTexture(){
			self.TEXTURE = -1;
		};
	};
	var CanvasApplicationSprite = function(){
		var self = this;
		if(!(self instanceof CanvasApplicationSprite)){// forces "new" prefix
			throw new TypeError("DOM object constructor cannot be called as a function.");
		};
		var coordinates = {x:0,y:0},
				textures = [];
		this.render = function(){
			ctx.save();
			ctx.translate(coordinates.x,coordinates.y);
			for(var i=0,texture;texture=textures[i++];){
				texture.RENDERER();
			};
			ctx.restore();
		};
		this.addTexture = function(texture){
			if(!!texture){
				if(!!texture.TEXTURE&&texture.TEXTURE===1){
					textures.push(texture);
				}else{
					var newTexture = new CanvasApplicationTexture(texture);
					if(newTexture.TEXTURE===1){
						textures.push(newTexture);
					}else{
						console.warn('SPRITE WARNING: unknown texture added; texture ignored.');
					};
				};
			};
			return texture;
		};
		this.removeTexture = function(texture){
			if(!!texture){
				while(textures.indexOf(texture)>-1){
					textures.splice(textures.indexOf(texture),1);
				};
			};
		};
		this.delete = function(){
			sprites.splice(sprites.indexOf(self),1);
			for(var method in self){
				delete self[method];
			};
		};
		this.__defineGetter__('coordinates',function(){return coordinates;});
		sprites.push(self);
	};
	/* ----- CanvasApplicationRenderingContext2D Constructor Code ----- */
	var self = this,
			canvas = ctx.canvas;
	window.onresize = function(){
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
	};
	window.onresize();
	if(!(self instanceof CanvasApplicationRenderingContext2D)){// forces "new" prefix
		throw new TypeError("DOM object constructor cannot be called as a function.");
	};
	if(!(arguments.callee.caller===HTMLCanvasElement.prototype.getContext)){// must be created by the "HTMLCanvasElement.prototype.getContext" command
		throw new TypeError("Illegal invocation");
	};
	prototypeCTX();// adds functions to the context
	this.context = ctx;
	this.texture = CanvasApplicationTexture;
	this.sprite = CanvasApplicationSprite;
	this.__defineGetter__('sprites',function(){return sprites;});
	this.update = function(){// renders app AND clears canvas
		ctx.clearRect(0,0,canvas.width,canvas.height);
		self.render();
	};
	this.render = function(){// renders all sprites
		for(var i=0,sprite;sprite=sprites[i++];){
			sprite.render();
		};
	};
	this.setInterval = function(interval,params){
		return new CanvasApplicationInterval(interval,params);
	};
	this.preloadTextures = function(progressEvent,callback){
		function CanvasApplicationPreloadProgressEvent(){
			this.type = 'CanvasApplicationPreloadProgressEvent';
			this.progress = currentLoads/totalLoads;
			this.bubbles = false;
			this.cancelable = false;
			this.timestamp = Date.now();
		};
		function loadEvent(){
			currentLoads++;
			if(currentLoads===totalLoads){
				try{callback();}catch(e){};
			}else{
				try{progressEvent(new CanvasApplicationPreloadProgressEvent());}catch(e){};
			};
		};
		var totalLoads = 0,
				currentLoads = 0;
		for(var i=0,texture;texture=allTextures[i++];){
			if(texture.TEXTURE===1&&texture.TYPE===1){// if image
				if(texture.STATE===-1){
					totalLoads++;
					texture.onload = loadEvent;
				};
			};
		};
	};
	function prototypeCTX(){
		ctx.clear = function CanvasClearShim(){
			ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		};
	};
};
/* ----- Creates New Options In "HTMLCanvasElement.prototype.getContext" ----- */
var CanvasRenderingContext2DConstructor = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type){
	switch(type){
		case '2d':
			return CanvasRenderingContext2DConstructor.call(this,'2d');
		break;
		case '2d-application':
			var ctx = CanvasRenderingContext2DConstructor.call(this,'2d');
			return new CanvasApplicationRenderingContext2D(ctx);
		break;
		default:
			return null;
	};
};