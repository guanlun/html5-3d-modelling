module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._staticPlanes = [];
        this._forces = [];

        this.elasticity = 0.5;
        this.frictionCoeff = 0.5;
        this.airFriction = 0.1;
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

    clearStaticPlanes() {
        this._staticPlanes = [];
    }

    simulate(deltaT) {
        let timeRemaining = deltaT;

        this._objects.forEach(obj => {
            obj.calculateAcceleration(this._forces);

            this.checkResting(obj);
        });

        const MAX_ITERATION = 20;

        while (timeRemaining > 0) {
            let timeSimulated = timeRemaining;
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

            this._objects.forEach(obj => {
                // if ((Math.abs(obj.pos.x) > 4 || Math.abs(obj.pos.y) > 4 || Math.abs(obj.pos.z) > 4) &&
                //     (Math.abs(obj.lastState.pos.x) < 4 && Math.abs(obj.lastState.pos.y) < 4 && Math.abs(obj.lastState.pos.z) < 4)) {
                //     console.log('-----------------------------------------');
                //     console.log('pos', obj.pos);
                //     console.log('vel', obj.vel);
                //     console.log('lastPos', obj.lastState.pos);
                //     console.log('lastVel', obj.lastState.vel);
                // }
                obj.updateLastState();
            });
        }
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

    checkResting(obj) {
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

            const planeDist = obj.pos.y - obj.radius - plane.point.y;

            if (planeDist > 0.05) {
                return;
            }

            obj.restingAgainst = plane;
        });
    }

    addForce(force) {
        this._forces.push(force);
    }

    refreshDispaly() {
        this._objects.forEach(obj => {
            obj.updateGraphics();
        });
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
