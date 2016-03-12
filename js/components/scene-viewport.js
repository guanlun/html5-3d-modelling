module.exports = (function() {
    var Constants = require('../constants/constants');
    var Box = require('../scene/box');
    var PointerGroup = require('../scene/pointer-group');

    var SceneViewport = function() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, Constants.VIEWPORT_WIDTH / Constants.VIEWPORT_HEIGHT, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(Constants.VIEWPORT_WIDTH, Constants.VIEWPORT_HEIGHT);
        document.body.appendChild(this.renderer.domElement);

        this.initEventHandlers();

        this.box = new Box(1, 1, 1);
        this.box.setPosition(1, 1, 1);
        var boxMesh = this.box.getMeshObj();
        this.scene.add(boxMesh);

        this.pointerGroup = new PointerGroup();
        this.pointerGroup.attachToObj(this.box);
        this.scene.add(this.pointerGroup.getMeshObj());

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
        // Testing code for mouse picking
        var x = mouseEvent.clientX;
        var y = mouseEvent.clientY;

        var rayCaster = new THREE.Raycaster();
        var mouseVector = new THREE.Vector2();

        mouseVector.x = 2 * (x / Constants.VIEWPORT_WIDTH) - 1;
        mouseVector.y = 1 - 2 * (y / Constants.VIEWPORT_HEIGHT);

        rayCaster.setFromCamera( mouseVector, this.camera );
        var intersects = rayCaster.intersectObjects( [this.box.getMeshObj()], true );
        console.log(intersects);

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
