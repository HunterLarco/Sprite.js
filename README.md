Sprite.js
========

#### HTML5 Canvas Sprite API ####
The idea behind the Sprite API is to create a simple, easy to use library for creating canvas based applications and games. It essentially brings the DOM to the canvas by allowing for mouse events while at the same time retaining the integrity and diversity of the canvas.

### Usage ###
Download [sprite.js](./Scripts/sprite.js) and include it in your html.
```html
<script src='js/sprite.js'></script>
```

### Change Log ###
2012 28 04
* `clear` shim added to `2d-application` context
* `cooldown` and `MAX_FPS` params added to `CanvasApplicationInterval`
* Added [Interval Test](./Tests/interval.html)
* Began documenting Sprite JS
* `CanvasApplicationTexture` now supports data URI images
* Automatic check update functionality added

2012 27 04
* Interval `cooldown` variable bug fixed
* Added `.render`
* Image texture preloader created.

2012 26 04
* Interval FPS getter bug fixed

2012 21 04
* Added `CanvasApplicationInterval` constructor
* Added `CanvasApplicationTexture` constructor
* Added `CanvasApplicationSprite` constructor

2012 20 04
* Sprite JS begins
