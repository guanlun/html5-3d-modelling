module.exports = (function() {
    var Constants = require('../constants/constants');
    var EventEmitter = require('../utils/event-emitter');

    var ObjectCreationPanel = function() {

    };

    ObjectCreationPanel.prototype = EventEmitter.prototype;

    var ocp = new ObjectCreationPanel();

    ocp.emit('haha');

    return ObjectCreationPanel;
}());
