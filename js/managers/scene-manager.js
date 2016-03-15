module.exports = (function() {
    var EventEmitter = require('../utils/event-emitter');

    var SceneManager = function() {
        EventEmitter.apply(this);

        this._sceneObjects = [];
    };

    SceneManager.prototype = new EventEmitter();

    SceneManager.prototype.addObject = function(object) {
        this._sceneObjects.push(object);

        this.emit('OBJECT_ADDED');
    };

    // We'll only be needing one instance to the scene manager
    return new SceneManager();
}());
