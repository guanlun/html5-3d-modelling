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
                    obj.collisionNormal = col.normal;

                    // let collisionTime;
                    //
                    // if (col.withPlane) {
                    //     collisionTime = (d0 / (d0 - d1)) * deltaT;
                    // } else if (col.withObject) {
                    //     const obj2 = col.withObject;
                    //
                    //     // TODO: move this somewhere else
                    //     const collisionDistance = obj.radius + obj2.radius;
                    //
                    //     const lastPos = obj.lastState.pos;
                    //     collisionTime = ((col.lastDist - collisionDistance) / (col.lastDist - col.dist)) * deltaT;
                    // }

                    const collisionTime = col.fraction * deltaT

                    if (collisionTime < earliestCollisionTime) {
                        // Get the earliest collision in this timestep
                        earliestCollisionTime = collisionTime;
                        earliestCollision = col;
                    }
                });

                timeSimulated = earliestCollisionTime;

                this._objects.forEach(obj => {
                    obj.restoreLastState();
                    obj.integrate(timeSimulated);

                    if (earliestCollision) {
                        if (earliestCollision.withPlane) {
                            obj.respondToCollision(earliestCollision);
                        }
                    }

                    console.log('-----------------------');
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
                    });
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

            const objPlaneDist = obj.pos.clone().sub(point).dot(normal);
            const lastObjPlaneDist = obj.lastState.pos.clone().sub(point).dot(normal);

            if (objPlaneDist <= obj.radius && lastObjPlaneDist > obj.radius) {
                const d0 = lastObjPlaneDist - obj.radius;
                const d1 = objPlaneDist - obj.radius;
                const collisionFraction = d0 / (d0 - d1);

                collisions.push({
                    withPlane: true,
                    normal: normal,
                    object: obj,
                    dist: objPlaneDist,
                    lastDist: lastObjPlaneDist,
                    fraction: collisionFraction,
                });
            }
        });

        return collisions;
    }
}
