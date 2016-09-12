const BASE_PLANE_Y = -5;

module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._staticPlanes = [];

        this.elasticity = 0.5;
        this.frictionCoeff = 0.5;
    }

    addObject(object) {
        this._objects.push(object);
    }

    getObjects() {
        return this._objects;
    }

    addStaticPlane(so) {
        this._staticPlanes.push(so);
    }

    simulate(deltaT) {
        let timeSimulated = deltaT;
        let timeRemaining = deltaT;

        this._objects.forEach(obj => {
            obj.calculateAcceleration();

            obj.restingAgainst = null;

            // check resting condition
            this._staticPlanes.forEach(plane => {
                if (plane.normal.y != 1) {
                    return;
                }

                const {
                    normal,
                } = plane;

                const normalVel = obj.vel.clone().multiplyScalar(obj.vel.dot(normal));

                if (normalVel.y > 0.05) {
                    return;
                }

                const planeDist = obj.pos.y - obj.radius - (-5);

                if (planeDist > 0.05) {
                    return;
                }

                obj.restingAgainst = plane;
            });
        });

        const MAX_ITERATION = 20;

        while (timeRemaining > 0.01 * deltaT) {
            this._objects.forEach(obj => {
                obj.integrate(timeRemaining);
            });

            const collisions = this.getCollisions();

            let earliestCollisionTime = deltaT;
            let earliestCollision = null;

            if (collisions.length !== 0) {
                collisions.forEach(col => {
                    const obj = col.object;
                    obj.collisionNormal = col.normal;

                    const collisionTime = col.fraction * deltaT;

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
                        if (
                            obj === earliestCollision.object ||
                            obj === earliestCollision.withObject
                        ) {
                            obj.respondToCollision(earliestCollision, this.elasticity, this.frictionCoeff);
                        }
                    }
                });
            }

            timeRemaining -= timeSimulated;
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

                const collisionNormal = obj2.pos.clone().sub(obj.pos).normalize();

                const lastPos = obj.lastState.pos;
                const collisionFraction = ((lastObjDist - collisionDistance) / (lastObjDist - objDist));

                if (lastObjDist >= collisionDistance && objDist < collisionDistance) {
                    collisions.push({
                        withPlane: false,
                        object: obj,
                        withObject: obj2,
                        normal: collisionNormal,
                        fraction: collisionFraction,
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

            if (objPlaneDist < obj.radius && lastObjPlaneDist > obj.radius) {
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
