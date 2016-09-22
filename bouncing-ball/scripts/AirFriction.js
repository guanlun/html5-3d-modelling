const Force = require('./Force');

module.exports = class AirFriction extends Force {
    constructor() {
        super();

        this._frictionCoefficient = 0.1;
    }

    apply(object) {
        const v = object.vel;

        const force = new THREE.Vector3(
            -v.x * this._frictionCoefficient,
            -v.y * this._frictionCoefficient,
            -v.z * this._frictionCoefficient
        );

        object.acc.add(force);
    }

    setCoefficient(c) {
        this._frictionCoefficient = c;
    }
}
