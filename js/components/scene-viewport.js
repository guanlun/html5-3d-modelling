module.exports = (function() {
    var Constants = require('../constants/constants'),
        EventType = Constants.EventType,
        Box = require('../scene/box'),
        PointerGroup = require('../scene/pointer-group'),
        SceneManager = require('../managers/scene-manager');

    var SceneViewport = function() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, Constants.VIEWPORT_WIDTH / Constants.VIEWPORT_HEIGHT, 0.1, 1000);
        this.camera.position.set(0, 0, 4);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(Constants.VIEWPORT_WIDTH, Constants.VIEWPORT_HEIGHT);
        document.body.appendChild(this.renderer.domElement);

        this.pointerGroup = new PointerGroup();
        this.scene.add(this.pointerGroup.getMeshObj());

        this.initEventHandlers();

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
            .on('click', this._clickHandler.bind(this))
            .on('mousedown', this._mouseDownHandler.bind(this))
            .on('mouseup', this._mouseUpHandler.bind(this))
            .on('mousemove', this._mouseMoveHandler.bind(this));

        SceneManager.addListener(EventType.OBJECT_ADDED, function(payload) {
            var newObject = payload.object;

            this.scene.add(newObject.getMeshObj());
        }.bind(this));
    };

    SceneViewport.prototype._clickHandler = function(mouseEvent) {
        // Testing code for mouse picking
        var x = mouseEvent.offsetX;
        var y = mouseEvent.offsetY;

        var rayCaster = new THREE.Raycaster();
        var mouseVector = new THREE.Vector2();

        mouseVector.x = 2 * (x / Constants.VIEWPORT_WIDTH) - 1;
        mouseVector.y = 1 - 2 * (y / Constants.VIEWPORT_HEIGHT);

        rayCaster.setFromCamera( mouseVector, this.camera );

        var intersects = rayCaster.intersectObjects(this.scene.children, true );
        var firstIntersectedObj = intersects[0];

        if (firstIntersectedObj) {
            this.pointerGroup.attachToObj(firstIntersectedObj.object.hObject);
        }
    }

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
