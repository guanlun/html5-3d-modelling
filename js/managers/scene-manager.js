module.exports = (function() {
    var Constants = require('../constants/constants'),
        EventType = Constants.EventType,
        EventEmitter = require('../utils/event-emitter');

    var SceneManager = function() {
        EventEmitter.apply(this);

        this._sceneObjects = [];
    };

    SceneManager.prototype = new EventEmitter();

    SceneManager.prototype.addObject = function(object) {
        this._sceneObjects.push(object);

        var payload = {
            object: object
        };

        this.emit(EventType.OBJECT_ADDED, payload);
    };

    // We'll only be needing one instance to the scene manager
    return new SceneManager();
}());
