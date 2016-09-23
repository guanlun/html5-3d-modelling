const Constants = require('./Constants');

module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._staticPlanes = [];
        this._forces = [];

        this._currGenerated = 0;
        this._currSmokeGenerated = 0;

        this.startPos = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.generateParticles = false;

        this._vortices = [];
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

    setParticles(particles) {
        this._particles = particles;
    }

    setSmokeParticles(smokeParticles) {
        this._smokeParticles = smokeParticles;
    }

    simulateVortices() {
        if (this.generateParticles) {
            if (Math.random() > 0.9) {
                // Generate a vortex
                const vortex = {
                    pos: {
                        x: this.startPos.x,
                        y: this.startPos.y + 1,
                        z: this.startPos.z,
                    },
                    vel: {
                        x: Math.random() * 0.01 - 0.005,
                        y: Math.random() * 0.03 + 0.05,
                        z: 0,
                    },
                    radius: Math.random(),
                    angularVel: Math.random(),
                };

                this._vortices.push(vortex);
            }

            for (let i = 0; i < this._vortices; i++) {
                const vortex = this._vortices[i];
                vortex.pos.x += vortex.vel.x;
                vortex.pos.y += vortex.vel.y;
                vortex.pos.z += vortex.vel.z;
            }
        }
    }

    simulate() {
        this.simulateVortices();

        const sp = this._smokeParticles.attributes.position.array;
        const sv = this._smokeParticles.attributes.velocity.array;
        const sa = this._smokeParticles.attributes.age.array;
        const ss = this._smokeParticles.attributes.state.array;

        if (this.generateParticles) {
            const lastSmokeParticleIndex = this._currSmokeGenerated;

            this._currSmokeGenerated += Math.floor((Math.random() * 5 + 3));

            for (let i = lastSmokeParticleIndex; i < this._currSmokeGenerated; i++) {
                const idx = i % Constants.SMOKE.PARTICLE_NUM;
                ss[idx] = 1;
                sa[idx] = 0;

                sp[idx * 3] = this.startPos.x;
                sp[idx * 3 + 1] = this.startPos.y;
                sp[idx * 3 + 2] = this.startPos.z;

                sv[i * 3] = Math.random() * 0.01 - 0.005;
                sv[i * 3 + 1] = Math.random() * 0.03 + 0.05;
                sv[i * 3 + 2] = 0;
            }
        }

        for (let i = 0; i < Constants.SMOKE.PARTICLE_NUM; i++) {
            if (ss[i] === 1) {
                for (let j = 0; j < this._vortices.length; j++) {
                    const vortex = this._vortices[j];

                    const diffX = sp[i * 3] - vortex.pos.x;
                    const diffY = sp[i * 3 + 1] - vortex.pos.y;
                    // const diffZ = sp[i * 3 + 2] - vortex.pos.z;

                    const dist = Math.sqrt(diffX * diffX + diffY * diffY);

                    if (dist < vortex.radius) {
                        const p = 0.008 / (1 + dist * dist);
                        const aVel = vortex.angularVel;

                        sv[i * 3] += -p * diffY * aVel;
                        sv[i * 3 + 1] += p * diffX * aVel;
                    }
                }

                sv[i * 3] *= 0.999;
                sv[i * 3 + 1] *= 0.999;
                sv[i * 3 + 2] *= 0.999;

                sp[i * 3] += sv[i * 3];
                sp[i * 3 + 1] += sv[i * 3 + 1];
                sp[i * 3 + 2] += sv[i * 3 + 2];

                sa[i] += 0.01;

                if (sa[i] > 10) {
                    // Recycle particles if the age is too large
                    sa[i] = 0;
                    ss[i] = 0;
                }
            }
        }

        this._smokeParticles.attributes.velocity.needsUpdate = true;
        this._smokeParticles.attributes.position.needsUpdate = true;
        this._smokeParticles.attributes.age.needsUpdate = true;
        this._smokeParticles.attributes.state.needsUpdate = true;



        const p = this._particles.attributes.position.array;
        const v = this._particles.attributes.velocity.array;
        const a = this._particles.attributes.age.array;
        const s = this._particles.attributes.state.array;

        if (this.generateParticles) {
            const lastParticleIndex = this._currGenerated;

            this._currGenerated += Math.floor((Math.random() * 30 + 10));

            for (let i = lastParticleIndex; i < this._currGenerated; i++) {
                const idx = i % Constants.SPARK.PARTICLE_NUM;
                s[idx] = 1;
                a[idx] = 0;

                p[idx * 3] = this.startPos.x;
                p[idx * 3 + 1] = this.startPos.y;
                p[idx * 3 + 2] = this.startPos.z;

                v[idx * 3] = (Math.random() * 0.1 - 0.05);
                v[idx * 3 + 1] = (Math.random() * 0.25);
                v[idx * 3 + 2] = (Math.random() * 0.05 + 0.05);
            }
        }

        for (let i = 0; i < Constants.SPARK.PARTICLE_NUM; i += 2) {
            if (s[i] === 1) {
                v[i * 3 + 1] -= 0.01;

                p[i * 3] = p[i * 3 + 3];
                p[i * 3 + 1] = p[i * 3 + 4];
                p[i * 3 + 2] = p[i * 3 + 5];

                p[i * 3 + 3] += 2 * v[i * 3];
                p[i * 3 + 4] += 2 * v[i * 3 + 1];
                p[i * 3 + 5] += 2 * v[i * 3 + 2];

                a[i] += 0.002;
                a[i + 1] += 0.002;

                if (a[i] > 3) {
                    // Recycle particles if the age is too large
                    a[i] = 0;
                    s[i] = 0;
                }
            }
        }

        this._particles.attributes.position.needsUpdate = true;
        this._particles.attributes.velocity.needsUpdate = true;
        this._particles.attributes.age.needsUpdate = true;
        this._particles.attributes.state.needsUpdate = true;
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
