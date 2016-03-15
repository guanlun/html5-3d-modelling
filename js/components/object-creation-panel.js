module.exports = (function() {
    var Constants = require('../constants/constants');
    var EventEmitter = require('../utils/event-emitter');
    var SceneManager = require('../managers/scene-manager');

    var Box = require('../scene/box');

    var ObjectCreationPanel = function() {
        var self = this;

        EventEmitter.call(this);

        this.$el = $('#object-creation-panel');

        this.$el
        .on('click', '[data-action="add-element"]', function(event) {
            var box = new Box(1, 1, 1);
            box.setPosition(1, 1, 1);
            var boxMesh = box.getMeshObj();

            SceneManager.addObject(box);
        })
    };

    ObjectCreationPanel.prototype = new EventEmitter();

    return ObjectCreationPanel;
}());
