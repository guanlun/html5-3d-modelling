module.exports = (function() {
    var PointerGroup = function() {
        this._attachedSceneObj = null;

        this._group = new THREE.Group();

        this._xGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 32);
        this._xMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        this._xPointer = new THREE.Mesh(this._xGeometry, this._xMaterial);
        this._group.add(this._xPointer);

        this._yGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 32);
        this._yMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        this._yPointer = new THREE.Mesh(this._xGeometry, this._yMaterial);
        this._yPointer.rotateX(Math.PI / 2);
        this._group.add(this._yPointer);

        this._zGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 32);
        this._zMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
        this._zPointer = new THREE.Mesh(this._zGeometry, this._zMaterial);
        this._zPointer.rotateZ(Math.PI / 2);
        this._group.add(this._zPointer);
    };

    PointerGroup.prototype.attachToObj = function(sceneObj) {
        this._attachedSceneObj = sceneObj;
        var pos = sceneObj.getPosition();
        this._group.position.set(pos.x, pos.y, pos.z);
    };

    PointerGroup.prototype.getMeshObj = function() {
        return this._group;
    };

    return PointerGroup;
}());
