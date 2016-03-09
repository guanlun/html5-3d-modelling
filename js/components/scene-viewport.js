module.exports = (function() {
    var Constants = require('../constants/constants');
    var Box = require('../scene/box');

    var SceneViewport = function() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, Constants.VIEWPORT_WIDTH / Constants.VIEWPORT_HEIGHT, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(Constants.VIEWPORT_WIDTH, Constants.VIEWPORT_HEIGHT);
        document.body.appendChild(this.renderer.domElement);

        this.initEventHandlers();

        this.box = new Box(1, 1, 1);
        this.scene.add(this.box.getMeshObj());

        this.camera.position.set(0, 0, 5);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.camera.lookAt(0, 0, 0);

        this.render();
    };

    SceneViewport.prototype.render = function() {
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    };

    SceneViewport.prototype.initEventHandlers = function() {
        var rendererDom = this.renderer.domElement;

        this._lastMousePosition = null;

        $(rendererDom)
            .on('mousedown', this._mouseDownHandler.bind(this))
            .on('mouseup', this._mouseUpHandler.bind(this))
            .on('mousemove', this._mouseMoveHandler.bind(this));
    };

    SceneViewport.prototype._mouseDownHandler = function(mouseEvent) {
        this._lastMousePosition = {
            x: mouseEvent.offsetX,
            y: mouseEvent.offsetY
        };
    };

    SceneViewport.prototype._mouseUpHandler = function(mouseEvent) {
        this._lastMousePosition = null;

        var currMousePosition = {
            x: mouseEvent.offsetX,
            y: mouseEvent.offsetY
        };

        var gl = this.renderer.context;
//        var colorDataAtMousePosition = gl.readPixels(currMousePosition.x, currMousePosition.y, 1, 1);
//        console.log(colorDataAtMousePosition);
    };

    SceneViewport.prototype._mouseMoveHandler = function(mouseEvent) {
        if (this._lastMousePosition === null) {
            return;
        }

        var currMousePosition = {
            x: mouseEvent.offsetX,
            y: mouseEvent.offsetY
        };

        var positionDiff = {
            x: currMousePosition.x - this._lastMousePosition.x,
            y: currMousePosition.y - this._lastMousePosition.y
        };

        this.camera.position.x += positionDiff.x / 100;
        this.camera.position.y += positionDiff.y / 100;

        this._lastMousePosition = currMousePosition;
    };

    return SceneViewport;
}());
