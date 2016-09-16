const Force = require('./Force');

module.exports = class Gravity extends Force {
    constructor() {
        super();

        this._value = new THREE.Vector3(0, -10, 0);
    }

    apply(object) {
        object.acc.add(this._value);
    }
}
