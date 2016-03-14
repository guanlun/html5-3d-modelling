var SceneViewport = require('./components/scene-viewport');
var ObjectCreationPanel = require('./components/object-creation-panel');
var ObjectListingPanel = require('./components/object-listing-panel');

var sceneViewport = new SceneViewport();

var objectCreationPanel = new ObjectCreationPanel();

var objectListingPanel = new ObjectListingPanel();

objectCreationPanel.addListener('addElement', function() {
    sceneViewport.addObject();

    objectListingPanel.addObject();
});
