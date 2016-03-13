var SceneViewport = require('./components/scene-viewport');
var ObjectCreationPanel = require('./components/object-creation-panel');

var sceneViewport = new SceneViewport();

var objectCreationPanel = new ObjectCreationPanel();
objectCreationPanel.addListener('addElement', function() {
    sceneViewport.addObject();
});
