const SEG_LEN = 4;

module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._staticPlanes = [];
        this._forces = [];

        this.elasticity = 0.5;
        this.frictionCoeff = 0.5;
        this.airFriction = 0.1;

        this._currGenerated = 0;
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

        this._length = particles.attributes.position.array.length / 3;
        console.log(this._length);
        // this._length = particles.vertices.length / SEG_LEN;

        this._particleVel = [];

        for (let i = 0; i < this._length; i++) {
            const x = (Math.random() * 0.5);
            const y = (Math.random() * 0.5);
            const z = (Math.random() * 0.5);
            this._particleVel.push([x, y, z]);
        }
    }

    simulate(deltaT) {
        // return;
        if (this._currGenerated < this._length) {
            this._currGenerated += (Math.random() * 10 + 20);

            if (this._currGenerated > this._length) {
                this._currGenerated = this._length;
            }
        }
        for (let i = 0; i < this._currGenerated; i++) {
            // for (let j = SEG_LEN - 1; j >= 1; j--) {
            //     let srcIdx;
            //
            //     if (j == 1) {
            //         srcIdx = 0;
            //     } else {
            //         srcIdx = j - 2;
            //     }
            //
            //     const prevParticle = this._particles.vertices[i * SEG_LEN + j];
            //     const srcParticle = this._particles.vertices[i * SEG_LEN + srcIdx];
            //
            //     prevParticle.x = srcParticle.x;
            //     prevParticle.y = srcParticle.y;
            //     prevParticle.z = srcParticle.z;
            // }
            //
            // const particle = this._particles.vertices[i * SEG_LEN];
            //
            this._particleVel[i][1] -= 0.01;
            //
            // particle.x += this._particleVel[i][0];
            // particle.y += this._particleVel[i][1];
            // particle.z += this._particleVel[i][2];

            const p = this._particles.attributes.position.array;
            // console.log(p);
            p[i * 3] += this._particleVel[i][0];
            p[i * 3 + 1] += this._particleVel[i][1];
            p[i * 3 + 2] += this._particleVel[i][2];
            // console.log(p);
            // console.log(this._particleVel[i]);

            this._particles.attributes.age.array[i] -= 0.01;
        }

        this._particles.attributes.position.needsUpdate = true;
        this._particles.attributes.age.needsUpdate = true;
        // this.randColor = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        // this.shader.S
        // this._particles.verticesNeedUpdate = true;
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
