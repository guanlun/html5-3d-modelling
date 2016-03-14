module.exports = (function() {
    var Constants = require('../constants/constants');
    var EventEmitter = require('../utils/event-emitter');

    var ObjectCreationPanel = function() {
        var self = this;

        EventEmitter.call(this);

        this.$el = $('#object-creation-panel');

        this.$el
        .on('click', '[data-action="add-element"]', function(event) {
            self.emit("addElement");
        })
    };

    ObjectCreationPanel.prototype = new EventEmitter();

    return ObjectCreationPanel;
}());
