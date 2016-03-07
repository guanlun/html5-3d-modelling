define([
    '../constants/constants'
], function(Constants) {
    var SceneViewport = function() {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, Constants.VIEWPORT_WIDTH / Constants.VIEWPORT_HEIGHT, 0.1, 1000);

        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(Constants.VIEWPORT_WIDTH, Constants.VIEWPORT_HEIGHT);
        document.body.appendChild(renderer.domElement);

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh( geometry, material );
        scene.add( cube );

        camera.position.z = 5;

        function render() {
            requestAnimationFrame( render );
            renderer.render( scene, camera );
        }
        render();
    };

    return SceneViewport;
});
