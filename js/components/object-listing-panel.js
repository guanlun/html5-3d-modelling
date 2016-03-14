module.exports = (function() {
    var Constants = require('../constants/constants');
    var EventEmitter = require('../utils/event-emitter');

    var ObjectListingPanel = function() {
        var self = this;

        EventEmitter.call(this);

        this.$el = $('#object-listing-panel');
        this.$list = this.$el.find('ul');
    };

    ObjectListingPanel.prototype = new EventEmitter();

    ObjectListingPanel.prototype.addObject = function() {
        console.log(this.$list);
        this.$list.append('<li>Object</li>');
    };

    return ObjectListingPanel;
}());
