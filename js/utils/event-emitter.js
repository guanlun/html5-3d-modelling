module.exports = (function() {
    var EventEmitter = function() {
        this._eventListenerMapping = {};
    };

    EventEmitter.prototype.emit = function(eventName, data) {
        var eventListeners = this._eventListenerMapping[eventName];

        if (!eventListeners) {
            return;
        }

        for (var i = 0; i < eventListeners.length; i++) {
            var listener = eventListeners[i];
            listener.apply();
        }
    };

    EventEmitter.prototype.addListener = function(eventName, listener) {
        if (!this._eventListenerMapping[eventName]) {
            this._eventListenerMapping[eventName] = [];
        }

        this._eventListenerMapping[eventName].push(listener);
    };

    return EventEmitter;
}());
