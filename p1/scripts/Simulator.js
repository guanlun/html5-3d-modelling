const BASE_PLANE_Y = -5;

module.exports = class Simulator {
    constructor() {
        this._objects = [];
    }

    addObject(object) {
        this._objects.push(object);
    }

    simulate(deltaT) {
        let timeSimulated = deltaT;
        let timeRemaining = deltaT;

        this._objects.forEach(obj => {
            // TODO: put this somewhere else
            obj.collidedInThisTimestep = false;

            obj.calculateAcceleration();
        });

        const MAX_ITERATION = 20;
        let iterations = 0;

        while  (iterations++ < MAX_ITERATION && timeRemaining > 0.01 * deltaT) {
            this._objects.forEach(obj => {
                obj.integrate(timeSimulated);
            });

            const collisions = this.getCollisions();

            if (collisions.length !== 0) {
                let earliestCollisionTime = deltaT;
                collisions.forEach(col => {
                    const obj = col.object;
                    obj.collidedInThisTimestep = true;

                    let collisionTime;

                    if (col.withPlane) {
                        const lastPos = obj.lastState.pos;

                        const d0 = lastPos.y - obj.radius - BASE_PLANE_Y;
                        const d1 = obj.pos.y - obj.radius - BASE_PLANE_Y;

                        collisionTime = (d0 / (d0 - d1)) * deltaT;
                    } else if (col.withObject) {
                        const obj2 = col.withObject;
                        obj2.collidedInThisTimestep = true;

                        // TODO: move this somewhere else
                        const collisionDistance = obj.radius + obj2.radius;

                        const lastPos = obj.lastState.pos;
                        collisionTime = ((col.lastDist - collisionDistance) / (col.lastDist - col.dist)) * deltaT;
                        console.log(collisionTime);
                    }

                    if (collisionTime < earliestCollisionTime) {
                        // Get the earliest collision in this timestep
                        earliestCollisionTime = collisionTime;
                    }
                });

                timeSimulated = earliestCollisionTime;

                this._objects.forEach(obj => {
                    obj.restoreLastState();
                    obj.integrate(timeSimulated);

                    if (obj.collidedInThisTimestep) {
                        // TODO: this should be moved to simulator instead of being a object function
                        obj.respondToCollision();
                    }
                });
            }

            timeRemaining = timeRemaining - timeSimulated;
        }

        this._objects.forEach(obj => {
            obj.updateLastState(deltaT);
        });

    }

    getCollisions() {
        const collisions = [];

        const numObjs = this._objects.length;

        for (let i = 0; i < numObjs; i++) {
            const obj = this._objects[i];
            if (!obj.lastState) {
                continue;
            }

            if (
                obj.pos.y - obj.radius < BASE_PLANE_Y &&
                obj.lastState.pos.y - obj.radius >= BASE_PLANE_Y
            ) {
                collisions.push({
                    withPlane: true,
                    object: obj,
                });
            }

            for (let j = i + 1; j < numObjs; j++) {
                const obj2 = this._objects[j];

                const objDist = obj.pos.distanceTo(obj2.pos);
                const lastObjDist = obj.lastState.pos.distanceTo(obj2.lastState.pos);

                const collisionDistance = obj.radius + obj2.radius;

                if (lastObjDist >= collisionDistance && objDist < collisionDistance) {
                    collisions.push({
                        withPlane: false,
                        object: obj,
                        withObject: obj2,
                        dist: objDist,
                        lastDist: lastObjDist,
                    })
                }
            }
        }

        return collisions;
    }
}
