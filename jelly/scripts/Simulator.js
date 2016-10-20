const Constants = require('./Constants');
const Strut = require('./Strut');

module.exports = class Simulator {
    constructor() {
        this._vertices = [];
        this._struts = [];
    }

    simulate() {
        if (!this.geometry) {
            return;
        }
        this.geometry.vertices[0].set(Math.random(), 1, 1);
        this.geometry.verticesNeedUpdate = true;
    }

    addVertex(vertex) {
        this._vertices.push(vertex);
    }

    setGeometry(object) {
        this.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        this.geometry.faces.forEach(f => {
            const v1 = this.geometry.vertices[f.a];
            const v2 = this.geometry.vertices[f.b];
            const v3 = this.geometry.vertices[f.c];
        });
    }
}
