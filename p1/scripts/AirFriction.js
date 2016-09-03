const Force = require('./Force');

module.exports = class AirFriction extends Force {
    constructor() {
        super();

        this._frictionCoefficient = 1;
    }

    apply(collider) {
        const v = collider.getVelocity();
        const m = collider.getMass();

        const force = new THREE.Vector3(
            -v.x * this._frictionCoefficient / m,
            -v.y * this._frictionCoefficient / m,
            -v.z * this._frictionCoefficient / m
        );

        collider.getAcceleration().add(force);
    }
}
