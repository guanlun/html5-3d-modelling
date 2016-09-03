module.exports = class Collider {
    constructor() {
        this._mass = 10;

        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        this._lastVelocity = new THREE.Vector3(0, 0, 0);
        this._lastPosition = new THREE.Vector3(0, 0, 0);

        this._forces = [];
    }

    getMass() {
        return this._mass;
    }

    getPosition() {
        return this._position;
    }

    getVelocity() {
        return this._velocity;
    }

    getAcceleration() {
        return this._acceleration;
    }

    _restore() {
        this._position.set(this._lastPosition.x, this._lastPosition.y, this._lastPosition.z);
        this._velocity.set(this._lastVelocity.x, this._lastVelocity.y, this._lastVelocity.z);
    }

    _updateLastState() {
        this._lastPosition.set(this._position.x, this._position.y, this._position.z);
        this._lastVelocity.set(this._velocity.x, this._velocity.y, this._velocity.z);
    }

    simulate(deltaT) {
        const PLANE_Y = -4;

        let timeRemaining = deltaT;
        let timeSimulated = deltaT;

        while (timeRemaining > 0) {
            this._calculateAcceleration();
            this._updateState(timeRemaining);

            if (this._collisionOccurred()) {
                const d0 = this._lastPosition.y - PLANE_Y;
                const d1 = this._lastPosition.y - this._position.y;

                timeSimulated = (d0 / d1) * deltaT;

                this._restore();

                this._updateState(timeSimulated);

                this._respondToCollision();
            }

            timeRemaining -= timeSimulated;
        }

        this._updateLastState();
    }

    _calculateAcceleration() {
        this._acceleration.set(0, 0, 0);

        this._forces.forEach(f => f.apply(this));
    }

    _updateState(deltaT) {
        const a = this._acceleration;
        this._velocity.add(new THREE.Vector3(a.x * deltaT, a.y * deltaT, a.z * deltaT));

        const v = this._velocity;
        this._position.add(new THREE.Vector3(v.x * deltaT, v.y * deltaT, v.z * deltaT));
    }

    _collisionOccurred() {
        const PLANE_Y = -4;
        return (this._lastPosition.y > PLANE_Y && this._position.y < PLANE_Y);
    }

    _respondToCollision() {
        this._velocity.y = -0.8 * this._velocity.y;
    }

    addForce(force) {
        this._forces.push(force);
    }
}
