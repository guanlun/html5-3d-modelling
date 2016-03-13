module.exports = (function() {
    var Box = function(x, y, z) {
        this._geometry = new THREE.BoxGeometry(x, y, z);
        this._material = new THREE.MeshBasicMaterial( { color: 0xffcc00 } );

        this._meshObj = new THREE.Mesh(this._geometry, this._material);

        // Temporary solution, points to the parent Box object
        this._meshObj.hObject = this;
    };

    Box.prototype.setPosition = function(x, y, z) {
        this._meshObj.position.set(x, y, z);
    };

    Box.prototype.getPosition = function() {
        return this._meshObj.position;
    };

    Box.prototype.getMeshObj = function() {
        return this._meshObj;
    };

    return Box;
}());
