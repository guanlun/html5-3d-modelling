module.exports = (function() {
    var Box = function(x, y, z) {
        this._geometry = new THREE.BoxGeometry(x, y, z);
        this._material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

        this._meshObj = new THREE.Mesh(this._geometry, this._material);
    };

    Box.prototype.setPosition = function(x, y, z) {

    };

    Box.prototype.getMeshObj = function() {
        return this._meshObj;
    };

    return Box;
}());
