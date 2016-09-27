const Constants = require('./Constants');

module.exports = class Simulator {
    constructor() {
        this._objects = [];
        this._triangles = [];

        this._currGenerated = 0;
        this._currSmokeGenerated = 0;

        this.startPos = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.generateParticles = false;

        this._vortices = [];

        this._lastPos = [];
    }

    addTriangle(vertices, normal) {
        this._triangles.push({
            vertices: vertices,
            normal: normal,
        });
    }

    setWelderPosition(pos) {
        this._welderPosition = pos;
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
                        y: this.startPos.y + 1.5,
                        z: this.startPos.z,
                    },
                    vel: {
                        x: Math.random() * 0.01 - 0.005,
                        y: Math.random() * 0.03 + 0.05,
                        z: 0,
                    },
                    radius: Math.random() * 2,
                    angularVel: Math.random() * 2 - 1,
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

                    const dist = Math.sqrt(diffX * diffX + diffY * diffY);

                    if (dist < vortex.radius) {
                        const p = 0.008 / (1 + dist * dist);
                        const aVel = vortex.angularVel;

                        sv[i * 3] += -p * diffY * aVel;
                        sv[i * 3 + 1] += p * diffX * aVel;
                    }
                }

                sv[i * 3] *= 0.995;
                sv[i * 3 + 1] *= 0.995;
                sv[i * 3 + 2] *= 0.995;

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

                this._lastPos[idx * 3] = p[idx * 3];
                this._lastPos[idx * 3 + 1] = p[idx * 3 + 1];
                this._lastPos[idx * 3 + 2] = p[idx * 3 + 2];
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

                const lp = this._lastPos;

                for (let ti = 0; ti < this._triangles.length; ti++) {
                    const t = this._triangles[ti];

                    // Any vertex on triangle
                    const tv = t.vertices[0];
                    const tp = {
                        x: tv.x + this.startPos.x,
                        y: tv.y + this.startPos.y,
                        z: tv.z + this.startPos.z
                    };
                    const tn = t.normal;

                    // point to point distance
                    const diffX = p[i * 3 + 3] - tp.x;
                    const diffY = p[i * 3 + 4] - tp.y;
                    const diffZ = p[i * 3 + 5] - tp.z;
                    const d = diffX * tn.x + diffY * tn.y + diffZ * tn.z;

                    const lastDiffX = lp[i * 3 + 3] - tp.x;
                    const lastDiffY = lp[i * 3 + 4] - tp.y;
                    const lastDiffZ = lp[i * 3 + 5] - tp.z;
                    const lastD = lastDiffX * tn.x + lastDiffY * tn.y + lastDiffZ * tn.z;

                    if (d < 0 && lastD > 0) {
                        if (this._pointInTriangle(p[i * 3 + 3] - this.startPos.x, p[i + 3 + 4] - this.startPos.y, p[i * 3 + 5] - this.startPos.z, t.vertices)) {
                            const dotVN = v[i * 3] * tn.x + v[i * 3 + 1] * tn.y + v[i * 3 + 2] * tn.z;

                            const vNormalX = tn.x * dotVN;
                            const vNormalY = tn.y * dotVN;
                            const vNormalZ = tn.z * dotVN;

                            const vTangentX = v[i * 3] - vNormalX;
                            const vTangentY = v[i * 3 + 1] - vNormalY;
                            const vTangentZ = v[i * 3 + 2] - vNormalZ;

                            v[i * 3] = -vNormalX + vTangentX * Math.random();
                            v[i * 3 + 1] = -vNormalY + vTangentY * Math.random();
                            v[i * 3 + 2] = -vNormalZ + vTangentZ * Math.random();
                            a[i] = 0;
                            break;
                        }
                    }
                }

                lp[i * 3 + 3] = p[i * 3 + 3];
                lp[i * 3 + 4] = p[i * 3 + 4];
                lp[i * 3 + 5] = p[i * 3 + 5];

                if (a[i] > 1) {
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

    _pointInTriangle(px, py, pz, vertices) {
        const p1 = vertices[0];
        const p2 = vertices[1];
        const p3 = vertices[2];

        const a = ((p2.z - p3.z) * (px - p3.x) + (p3.x - p2.x) * (pz - p3.z)) / ((p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z));
        const b = ((p3.z - p1.z) * (px - p3.x) + (p1.x - p3.x) * (pz - p3.z)) / ((p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z));
        const c = 1 - a - b;

        return (a > 0) && (b > 0) && (c > 0);
    }
}
