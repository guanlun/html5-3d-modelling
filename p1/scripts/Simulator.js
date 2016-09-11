const BASE_PLANE_Y = -5;

module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._staticPlanes = [];
    }

    addObject(object) {
        this._objects.push(object);
    }

    addStaticPlane(so) {
        this._staticPlanes.push(so);
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

        while (iterations++ < MAX_ITERATION && timeRemaining > 0.01 * deltaT) {
            this._objects.forEach(obj => {
                obj.integrate(timeSimulated);
            });

            const collisions = this.getCollisions();

            let earliestCollisionTime = deltaT;
            let earliestCollision = null;

            if (collisions.length !== 0) {
                collisions.forEach(col => {
                    const obj = col.object;
                    obj.collidedInThisTimestep = true;
                    obj.collisionNormal = col.normal;

                    let collisionTime;

                    if (col.withPlane) {
                        const lastPos = obj.lastState.pos;

                        // TODO: CHANGE THIS!
                        let d0, d1;

                        if (col.normal.y == 1) {
                            d0 = lastPos.y - obj.radius - BASE_PLANE_Y;
                            d1 = obj.pos.y - obj.radius - BASE_PLANE_Y;
                        } else if (col.normal.x == -1) {
                            console.log(col);
                            d0 = lastPos.x + obj.radius - 5;
                            d1 = obj.pos.x - obj.radius - 5;
                        }

                        collisionTime = (d0 / (d0 - d1)) * deltaT;
                    } else if (col.withObject) {
                        const obj2 = col.withObject;
                        obj2.collidedInThisTimestep = true;

                        // TODO: move this somewhere else
                        const collisionDistance = obj.radius + obj2.radius;

                        const lastPos = obj.lastState.pos;
                        collisionTime = ((col.lastDist - collisionDistance) / (col.lastDist - col.dist)) * deltaT;
                    }

                    console.log(collisionTime);

                    if (collisionTime < earliestCollisionTime) {
                        // Get the earliest collision in this timestep
                        earliestCollisionTime = collisionTime;
                        earliestCollision = col;
                    }
                });

                timeSimulated = earliestCollisionTime;

                this._objects.forEach(obj => {
                    // console.log(obj.pos);
                    obj.restoreLastState();
                    // console.log(obj.pos);
                    // console.log(timeSimulated);
                    obj.integrate(timeSimulated);

                    if (earliestCollision) {
                        if (earliestCollision.withPlane) {
                            // console.log(obj.pos);
                            obj.respondToCollision(earliestCollision);
                        }
                    }

                    console.log('-----------------------');

                    // if (obj.collidedInThisTimestep) {
                    //     // TODO: this should be moved to simulator instead of being a object function
                    //     obj.respondToCollision();
                    // }
                });
            }

            timeRemaining = timeRemaining - timeSimulated;
        }

        this._objects.forEach(obj => {
            obj.updateLastState(deltaT);
        });
    }

    getCollisions() {
        let collisions = [];

        const numObjs = this._objects.length;

        for (let i = 0; i < numObjs; i++) {
            const obj = this._objects[i];
            if (!obj.lastState) {
                continue;
            }

            const staticPlaneCollisions = this._getStaticPlaneCollisions(obj);

            collisions = collisions.concat(staticPlaneCollisions);

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

    _getStaticPlaneCollisions(obj) {
        const collisions = [];
        this._staticPlanes.forEach(plane => {
            const {
                point,
                normal,
            } = plane;

            if (normal.y == 1) {
                // TEMP
                const yPos = point.y;

                if (
                    obj.pos.y - obj.radius < yPos &&
                    obj.lastState.pos.y - obj.radius >= yPos
                ) {
                    collisions.push({
                        withPlane: true,
                        normal: normal,
                        object: obj,
                    });
                }
            } else if (normal.x == -1) {
                const xPos = point.x;

                if (
                    obj.pos.x + obj.radius > xPos &&
                    obj.lastState.pos.x + obj.radius <= xPos
                ) {
                    collisions.push({
                        withPlane: true,
                        normal: normal,
                        object: obj,
                    });
                }
            }
        });

        return collisions;
    }

    _getObjectCollisions() {

    }
}
