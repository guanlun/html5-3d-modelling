const Force = require('./Force');

module.exports = class Gravity extends Force {
    constructor() {
        super();

        this._value = new THREE.Vector3(0, -10, 0);
    }

    apply(collider) {
        collider.getAcceleration().add(this._value);
    }
}
