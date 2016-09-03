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

        
    }
}
