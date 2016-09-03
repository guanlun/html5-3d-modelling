const BASE_PLANE_Y = -5;

module.exports = class Simulator {
    constructor() {
        this._objects = [];
    }

    addObject(object) {
        this._objects.push(object);
    }

    simulate(deltaT) {
        this._objects.forEach(obj => {
            obj.calculateAcceleration();
        });

        this._objects.forEach(obj => {
            obj.integrate(deltaT);
        });

        if (this.collisionOccurred()) {
            
        }

        this._objects.forEach(obj => {
            obj.updateLastState(deltaT);
        });

    }

    collisionOccurred() {
        this._objects.forEach(obj => {
            if (!obj.lastState) {
                return;
            }

            // console.log(obj.pos.y, obj.lastState.pos.y);
            return (
                obj.pos.y - obj.radius < BASE_PLANE_Y &&
                obj.lastState.pos.y - obj.radius >= BASE_PLANE_Y
            );
        });
    }
}
