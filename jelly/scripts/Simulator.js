const Constants = require('./Constants');
const Strut = require('./Strut');

module.exports = class Simulator {
    constructor() {
        this.vertices = [];
        this._velocities = [];
        this._struts = [];
        this.faces = [];
    }

    simulate() {
        if (!this.geometry) {
            return;
        }

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            if (vertex.y === 0) {
                continue;
            }

            this._velocities[vi].y -= 0.002;

            vertex.x += this._velocities[vi].x;
            vertex.y += this._velocities[vi].y;
            vertex.z += this._velocities[vi].z;
        }

        for (let si = 0; si < this._struts.length; si++) {
            const strut = this._struts[si];

            strut.simulate();
        }

        for (let vi = 0; vi < this.vertices.length; vi++) {
            // const vertex = this.geometry.vertices[vi];
            //
            // if (vertex.y === 0) {
            //     continue;
            // }
            //
            // vertex.vel.x += vertex.acc.x;
            // vertex.vel.y += vertex.acc.y;
            // vertex.vel.z += vertex.acc.z;
            //
            // vertex.set(vertex.x + vertex.vel.x, vertex.y + vertex.vel.y, vertex.z + vertex.vel.z);
        }

        this.updateGeometry();

        this.geometry.verticesNeedUpdate = true;
    }

    addVertex(vertex) {
        this.vertices.push(vertex);
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
            this.geometry.vertices[fi * 6].set(vertex.x, vertex.y, vertex.z);

            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 1].set(vertex.x, vertex.y, vertex.z);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 2].set(vertex.x, vertex.y, vertex.z);

            vertexIndex = face.vertices[0];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 3].set(vertex.x, vertex.y, vertex.z);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 4].set(vertex.x, vertex.y, vertex.z);

            vertexIndex = face.vertices[3];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices[fi * 6 + 5].set(vertex.x, vertex.y, vertex.z);
        }
    }

    createGeometry() {
        for (let vi = 0; vi < this.vertices.length; vi++) {
            this._velocities[vi] = {
                x: 0,
                y: 0,
                z: 0,
            };
        }

        this.geometry = new THREE.Geometry();

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face =  this.faces[fi];

            let vertexIndex = face.vertices[0];
            let vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            vertexIndex = face.vertices[0];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
            vertexIndex = face.vertices[3];
            vertex = this.vertices[vertexIndex];
            this.geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));

            this.geometry.faces.push(new THREE.Face3(fi * 6, fi * 6 + 1, fi * 6 + 2));
            this.geometry.faces.push(new THREE.Face3(fi * 6 + 3, fi * 6 + 4, fi * 6 + 5));

            // this.geometry.faces.push(new THREE.Face3(face.vertices[0], face.vertices[1], face.vertices[2]));
            // this.geometry.faces.push(new THREE.Face3(f.vertices[0], f.vertices[1], f.vertices[3]));
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
