const Constants = require('./Constants');
const VecMath = require('./VecMath');
const Strut = require('./Strut');
const TorsionalStrut = require('./TorsionalStrut');

module.exports = class Simulator {
    constructor() {
        this.vertices = [];
        this._velocities = [];
        this._accelerations = [];
        this._struts = [];
        this.faces = [];
        this.edges = [];
    }

    saveState() {
        this.lastState = [];

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            vertex.acc.x = 0;
            vertex.acc.y = 0;
            vertex.acc.z = 0;

            this.lastState.push({
                pos: {
                    x: vertex.pos.x,
                    y: vertex.pos.y,
                    z: vertex.pos.z,
                },
                vel: {
                    x: vertex.vel.x,
                    y: vertex.vel.y,
                    z: vertex.vel.z,
                },
                acc: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            });
        }
    }

    restoreState() {
        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            const savedVertex = this.lastState[vi];

            vertex.pos.x = savedVertex.pos.x;
            vertex.pos.y = savedVertex.pos.y;
            vertex.pos.z = savedVertex.pos.z;

            vertex.vel.x = savedVertex.vel.x;
            vertex.vel.y = savedVertex.vel.y;
            vertex.vel.z = savedVertex.vel.z;

            vertex.acc.x = savedVertex.acc.x;
            vertex.acc.y = savedVertex.acc.y;
            vertex.acc.z = savedVertex.acc.z;
        }
    }

    goBackToOrigPos() {
        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            const savedVertex = this.lastState[vi];

            vertex.pos.x = savedVertex.pos.x;
            vertex.pos.y = savedVertex.pos.y;
            vertex.pos.z = savedVertex.pos.z;
        }
    }

    restoreVel() {
        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            const savedVertex = this.lastState[vi];

            vertex.vel.x = savedVertex.vel.x;
            vertex.vel.y = savedVertex.vel.y;
            vertex.vel.z = savedVertex.vel.z;
        }
    }

    computeSystemDynamics(t) {
        const k = [];

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            vertex.acc.x = 0;
            vertex.acc.y = -0.01;
            vertex.acc.z = 0;
        }

        for (let si = 0; si < this._struts.length; si++) {
            const strut = this._struts[si];

            strut.simulate(t);
        }

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];
            if (vertex.isStatic) {
                continue;
            }

            // if (vertex.pos.y === 0) {
            //
            // } else {
                vertex.vel = VecMath.add(vertex.vel, VecMath.scalarMult(t, vertex.acc));
            // }
        }
    }

    euler(t) {
        this.computeSystemDynamics(t);

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            if (vertex.isStatic) {
                // console.log('haha');
                continue;
            }

            vertex.pos = VecMath.add(vertex.pos, VecMath.scalarMult(t, vertex.vel));
        }
    }

    rk4(t) {
        // k1
        this.computeSystemDynamics(t / 2);

        const k1 = [];

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            k1.push({
                x: vertex.vel.x,
                y: vertex.vel.y,
                z: vertex.vel.z,
            });

            vertex.pos = VecMath.add(vertex.pos, VecMath.scalarMult(t / 2, vertex.vel));
        }

        // k2
        this.computeSystemDynamics(t / 2);

        const k2 = [];

        this.goBackToOrigPos();

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            k2.push({
                x: vertex.vel.x,
                y: vertex.vel.y,
                z: vertex.vel.z,
            });

            vertex.pos = VecMath.add(vertex.pos, VecMath.scalarMult(t / 2, vertex.vel));
        }

        // this.restoreVel();

        // k3
        this.computeSystemDynamics(t / 2);

        const k3 = [];

        this.goBackToOrigPos();

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            k3.push({
                x: vertex.vel.x,
                y: vertex.vel.y,
                z: vertex.vel.z,
            });

            vertex.pos = VecMath.add(vertex.pos, VecMath.scalarMult(t / 2, vertex.vel));
        }

        // this.restoreVel();

        // k4
        this.computeSystemDynamics(t);

        const k4 = [];

        this.goBackToOrigPos();

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            k4.push({
                x: vertex.vel.x,
                y: vertex.vel.y,
                z: vertex.vel.z,
            });
        }

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            vertex.vel = VecMath.scalarMult(1 / 6, VecMath.add(k1[vi], VecMath.scalarMult(2, k2[vi]), VecMath.scalarMult(2, k3[vi]), k4[vi]));

            vertex.pos = VecMath.add(vertex.pos, VecMath.scalarMult(t, vertex.vel));
        }
    }

    simulate(method, t, objects, shouldSaveState) {
        if (!this.geometry) {
            return;
        }

        if (shouldSaveState) {
            // if (this.vertices && this.lastState) {
            //     console.log(this.vertices[0].pos, this.lastState[0].pos);
            // }
            this.saveState();
        }

        if (method === 'Euler') {
            this.euler(t);
        } else {
            this.rk4(t);
        }

        this.updateGeometry();

        this.geometry.verticesNeedUpdate = true;
    }

    addVertex(vertexPos, vertexVel, isStatic) {
        const vel = isStatic ? {
            x: 0,
            y: 0,
            z: 0,
        } : {
            x: vertexVel.x,
            y: vertexVel.y,
            z: vertexVel.z,
        }
        const vertexData = {
            pos: vertexPos,
            vel: vel,
            acc: {
                x: 0,
                y: 0,
                z: 0,
            },
            isStatic: isStatic,
        };
        this.vertices.push(vertexData);
    }

    addFace(face) {
        this.faces.push(face);
    }

    updateGeometry() {
        for (let fi = 0; fi < this.faces.length; fi++) {
            const face =  this.faces[fi];

            let vertexIndex = face.vertices[0];
            let vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 3].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 3 + 1].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 3 + 2].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        }
    }

    createGeometry(springLengthMultiplier, springCoeff, dampingCoeff) {
        this.geometry = new THREE.Geometry();

        const vertexFaceLookup = {};

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face = this.faces[fi];

            const vertexIndex1 = face.vertices[0];
            const vertex1 = this.vertices[vertexIndex1];
            this.geometry.vertices.push(new THREE.Vector3(vertex1.pos.x, vertex1.pos.y, vertex1.pos.z));

            const vertexIndex2 = face.vertices[1];
            const vertex2 = this.vertices[vertexIndex2];
            this.geometry.vertices.push(new THREE.Vector3(vertex2.pos.x, vertex2.pos.y, vertex2.pos.z));

            const vertexIndex3 = face.vertices[2];
            const vertex3 = this.vertices[vertexIndex3];
            this.geometry.vertices.push(new THREE.Vector3(vertex3.pos.x, vertex3.pos.y, vertex3.pos.z));

            this.geometry.faces.push(new THREE.Face3(fi * 3, fi * 3 + 1, fi * 3 + 2));

            this.edges.push([vertexIndex1, vertexIndex2]);
            this.edges.push([vertexIndex1, vertexIndex3]);
            this.edges.push([vertexIndex2, vertexIndex3]);

            this._struts.push(new Strut(vertex1, vertex2, springLengthMultiplier, springCoeff, dampingCoeff));
            this._struts.push(new Strut(vertex1, vertex3, springLengthMultiplier, springCoeff, dampingCoeff));
            this._struts.push(new Strut(vertex2, vertex3, springLengthMultiplier, springCoeff, dampingCoeff));

            let lookupKey;
            if (vertexIndex1 > vertexIndex2) {
                lookupKey = vertexIndex2 + '-' + vertexIndex1;
            } else {
                lookupKey = vertexIndex1 + '-' + vertexIndex2;
            }

            let remVertexIndex = vertexFaceLookup[lookupKey];
            if (remVertexIndex === undefined) {
                vertexFaceLookup[lookupKey] = vertexIndex3;
            } else {
                this._struts.push(new TorsionalStrut(vertex1, vertex2, vertex3, this.vertices[remVertexIndex]));
            }

            if (vertexIndex1 > vertexIndex3) {
                lookupKey = vertexIndex3 + '-' + vertexIndex1;
            } else {
                lookupKey = vertexIndex1 + '-' + vertexIndex3;
            }

            remVertexIndex = vertexFaceLookup[lookupKey];
            if (remVertexIndex === undefined) {
                vertexFaceLookup[lookupKey] = vertexIndex2;
            } else {
                this._struts.push(new TorsionalStrut(vertex1, vertex3, vertex2, this.vertices[remVertexIndex]));
            }

            if (vertexIndex2 > vertexIndex3) {
                lookupKey = vertexIndex3 + '-' + vertexIndex2;
            } else {
                lookupKey = vertexIndex2 + '-' + vertexIndex3;
            }

            remVertexIndex = vertexFaceLookup[lookupKey];
            if (remVertexIndex === undefined) {
                vertexFaceLookup[lookupKey] = vertexIndex1;
            } else {
                this._struts.push(new TorsionalStrut(vertex2, vertex3, vertex1, this.vertices[remVertexIndex]));
            }
        }
    }
}
