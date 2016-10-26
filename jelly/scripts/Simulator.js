const Constants = require('./Constants');
const Strut = require('./Strut');
const TorsionalStrut = require('./TorsionalStrut');

module.exports = class Simulator {
    constructor() {
        this.vertices = [];
        this._velocities = [];
        this._accelerations = [];
        this._struts = [];
        this.faces = [];
    }

    simulate() {
        if (!this.geometry) {
            return;
        }
        // console.log('sim');

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            if (vertex.pos.y === 0) {
                continue;
            }

            vertex.vel.y -= 0.001;

            vertex.acc.x = 0;
            vertex.acc.y = 0;
            vertex.acc.z = 0;

            // vertex.pos.x += vertex.vel.x;
            // vertex.pos.y += vertex.vel.y;
            // vertex.pos.z += vertex.vel.z;
        }

        for (let si = 0; si < this._struts.length; si++) {
            const strut = this._struts[si];

            strut.simulate();
        }

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            if (vertex.pos.y === 0) {
                continue;
            }

            vertex.vel.x += vertex.acc.x;
            vertex.vel.y += vertex.acc.y;
            vertex.vel.z += vertex.acc.z;

            vertex.pos.x += vertex.vel.x;
            vertex.pos.y += vertex.vel.y;
            vertex.pos.z += vertex.vel.z;
        }

        this.updateGeometry();

        this.geometry.verticesNeedUpdate = true;
    }

    addVertex(vertexPos) {
        const vertexData = {
            pos: vertexPos,
            vel: {
                x: 0,
                y: 0,
                z: 0,
            },
            acc: {
                x: 0,
                y: 0,
                z: 0,
            },
        };
        this.vertices.push(vertexData);
    }

    addStrut() {

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

    createGeometry() {
        this.geometry = new THREE.Geometry();

        const vertexFaceLookup = {};

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face =  this.faces[fi];

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

            this._struts.push(new Strut(vertex1, vertex2));
            this._struts.push(new Strut(vertex1, vertex3));
            this._struts.push(new Strut(vertex2, vertex3));

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

    setGeometry(object) {
        this.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        this.geometry.vertices.forEach(v => {
            v.acc = {
                x: 0,
                y: -0.002,
                z: 0,
            };
            v.vel = {
                x: 0,
                y: 0,
                z: 0,
            };
        });

        this.geometry.faces.forEach(f => {
            const v1 = this.geometry.vertices[f.a];
            const v2 = this.geometry.vertices[f.b];
            const v3 = this.geometry.vertices[f.c];

            this._struts.push(new Strut(v1, v2));
            this._struts.push(new Strut(v1, v3));
            this._struts.push(new Strut(v2, v3));
        });
    }
}
