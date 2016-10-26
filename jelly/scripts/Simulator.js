const Constants = require('./Constants');
const Strut = require('./Strut');

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

            // console.log(strut);

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
            this.geometry.vertices[fi * 6].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 1].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 2].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[0];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 3].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 4].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);

            vertexIndex = face.vertices[3];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 5].set(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        }
    }

    createGeometry() {
        this.geometry = new THREE.Geometry();

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face =  this.faces[fi];

            let vertexIndex = face.vertices[0];
            let vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));
            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));
            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));
            vertexIndex = face.vertices[0];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));
            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));
            vertexIndex = face.vertices[3];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z));

            this.geometry.faces.push(new THREE.Face3(fi * 6, fi * 6 + 1, fi * 6 + 2));
            this.geometry.faces.push(new THREE.Face3(fi * 6 + 3, fi * 6 + 4, fi * 6 + 5));

            this._struts.push(new Strut(this.vertices[face.vertices[0]], this.vertices[face.vertices[1]]));
            this._struts.push(new Strut(this.vertices[face.vertices[1]], this.vertices[face.vertices[2]]));
            this._struts.push(new Strut(this.vertices[face.vertices[2]], this.vertices[face.vertices[3]]));
            this._struts.push(new Strut(this.vertices[face.vertices[3]], this.vertices[face.vertices[0]]));
            this._struts.push(new Strut(this.vertices[face.vertices[0]], this.vertices[face.vertices[2]]));
            this._struts.push(new Strut(this.vertices[face.vertices[1]], this.vertices[face.vertices[3]]));
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
