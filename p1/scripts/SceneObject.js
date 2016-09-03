module.exports = class SceneObject {
    constructor(pos) {
        this._graphicsObject = null;

        this.pos = pos || new THREE.Vector3(0, 0, 0);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.acc = new THREE.Vector3(0, 0, 0);

        this._forces = [];

        this._lastState = null;
    }

    setInitialVelocity(vel) {
        this.vel = vel;
    }

    addForce(f) {
        this._forces.push(f);
    }

    getGraphicsObject() {
        return this._graphicsObject;
    }

    calculateAcceleration() {
        this.acc.set(0, 0, 0);

        this._forces.forEach(f => f.apply(this));
    }

    integrate(deltaT) {
        this.vel.add(new THREE.Vector3(this.acc.x * deltaT, this.acc.y * deltaT, this.acc.z * deltaT));
        this.pos.add(new THREE.Vector3(this.vel.x * deltaT, this.vel.y * deltaT, this.vel.z * deltaT));
    }

    updateGraphics() {
        // console.log(this._graphicsObject);
        this._graphicsObject.position.set(this.pos.x, this.pos.y, this.pos.z);
    }

    restoreLastState() {

    }
}
