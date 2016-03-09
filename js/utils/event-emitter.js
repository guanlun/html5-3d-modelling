module.exports = (function() {
    var EventEmitter = function() {
    };

    EventEmitter.prototype.emit = function(eventName, data) {
        console.log('emitting: ', eventName);
    };

    return EventEmitter;
}());
