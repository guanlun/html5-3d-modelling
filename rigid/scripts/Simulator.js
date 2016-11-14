const Constants = require('./Constants');
const VecMath = require('./VecMath');
const ObjectState = require('./ObjectState');

module.exports = class Simulator {
    constructor() {
        this.state = new ObjectState();

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

    }

    euler(t) {
        this.computeSystemDynamics(t);

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.vertices[vi];

            if (vertex.isStatic) {
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

    computeDerivative(state, mass) {
        const dState = new ObjectState();

        dState.x = math.divide(state.p, mass);

        dState.p = [0, -0.001, 0];

        return dState;
    }

    applyStateDerivative(state, dState, h) {
        const newState = new ObjectState();

        newState.x = math.add(state.x, math.multiply(dState.x, h));
        newState.p = math.add(state.p, math.multiply(dState.p, h));

        return newState;
    }

    simulate(method, t, objects, shouldSaveState) {
        if (!this.geometry) {
            return;
        }

        const dState = this.computeDerivative(this.state, 1);

        const newState = this.applyStateDerivative(this.state, dState, 1);

        this.state = newState;

        // console.log(dState);

        // this.state.x[1] += 0.001;

        // if (shouldSaveState) {
        //     this.saveState();
        // }
        //
        // if (method === 'Euler') {
        //     this.euler(t);
        // } else {
        //     this.rk4(t);
        // }

        this.updateGeometry();

        this.geometry.verticesNeedUpdate = true;
    }

    addFace(face) {
        this.faces.push(face);
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

    computeCenterOfMass() {
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let minZ = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE
        let maxZ = -Number.MAX_VALUE;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const p = this.vertices[vi].pos;

            if (p[0] > maxX) {
                maxX = p[0];
            }

            if (p[0] < minX) {
                minX = p[0];
            }

            if (p[1] > maxY) {
                maxY = p[1];
            }

            if (p[1] < minY) {
                minY = p[1];
            }

            if (p[2] > maxZ) {
                maxZ = p[2];
            }

            if (p[2] < minZ) {
                minZ = p[2];
            }
        }

        minX -= 0.1;
        minY -= 0.1;
        minZ -= 0.1;
        maxX += 0.1;
        maxY += 0.1;
        maxZ += 0.1;

        const xStep = (maxX - minX) / 10;
        const yStep = (maxY - minY) / 10;
        const zStep = (maxZ - minZ) / 10;

        const pointsInObject = [];

        for (let x = minX; x <= maxX; x += xStep) {
            for (let y = minY; y <= maxY; y += yStep) {
                // const x = 0;
                // const y = 0.5;

                const zIntersectionIndices = [];

                for (let fi = 0; fi < this.faces.length; fi++) {
                    const triangleVertices = this.faces[fi].vertices;
                    const v1 = this.vertices[triangleVertices[0]].pos;
                    const v2 = this.vertices[triangleVertices[1]].pos;
                    const v3 = this.vertices[triangleVertices[2]].pos;

                    const v12 = math.subtract(v2, v1);
                    const v13 = math.subtract(v3, v1);

                    const xDiff = x - v1[0];
                    const yDiff = y - v1[1];

                    const m = v12[0];
                    const n = v12[1];
                    const p = v13[0];
                    const q = v13[1];

                    const b = (m * yDiff - xDiff * n) / (m * q - n * p);
                    const a = (xDiff - b * p) / m;

                    const c = 1 - a - b;

                    if (a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1) {
                        const zPos = a * v12[2] + b * v13[2] + v1[2];

                        zIntersectionIndices.push(zPos);
                    }
                }

                zIntersectionIndices.sort();

                let isInside = false;

                let lastZ = minZ;

                let currIntersectIndex = 0;

                for (let z = minZ; z <= maxZ; z += zStep) {
                    const currIntersectZ = zIntersectionIndices[currIntersectIndex];

                    if (z > currIntersectZ && lastZ <= currIntersectZ) {
                        currIntersectIndex++;
                        isInside = !isInside;
                    }

                    if (isInside) {
                        pointsInObject.push([x, y, z]);
                    }

                    lastZ = z;
                }
            }
        }

        let aggr = [0, 0, 0];

        for (let pi = 0; pi < pointsInObject.length; pi++) {
            const point = pointsInObject[pi];

            aggr = math.add(aggr, point);
        }

        const centerOfMass = math.divide(aggr, pointsInObject.length);
        console.log(centerOfMass);
    }

    updateGeometry() {
        const globalPos = this.state.x;
        const globalRotation = this.state.r;

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face =  this.faces[fi];

            let vertexIndex = face.vertices[0];
            let vertex = this.vertices[vertexIndex];
            let worldPos = math.add(globalPos, math.multiply(globalRotation, vertex.pos));
            this.geometry.vertices[fi * 3].set(worldPos._data[0], worldPos._data[1], worldPos._data[2]);

            vertexIndex = face.vertices[1];
            vertex = this.vertices[vertexIndex];
            worldPos = math.add(globalPos, math.multiply(globalRotation, vertex.pos));
            this.geometry.vertices[fi * 3 + 1].set(worldPos._data[0], worldPos._data[1], worldPos._data[2]);

            vertexIndex = face.vertices[2];
            vertex = this.vertices[vertexIndex];
            worldPos = math.add(globalPos, math.multiply(globalRotation, vertex.pos));
            this.geometry.vertices[fi * 3 + 2].set(worldPos._data[0], worldPos._data[1], worldPos._data[2]);
        }
    }

    createGeometry(springLengthMultiplier, springCoeff, dampingCoeff, elasticity) {
        this.geometry = new THREE.Geometry();

        const vertexFaceLookup = {};

        this.elasticity = elasticity;

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face = this.faces[fi];

            const vertexIndex1 = face.vertices[0];
            const vertex1 = this.vertices[vertexIndex1];
            this.geometry.vertices.push(new THREE.Vector3(vertex1.pos[0], vertex1.pos[1], vertex1.pos[2]));

            const vertexIndex2 = face.vertices[1];
            const vertex2 = this.vertices[vertexIndex2];
            this.geometry.vertices.push(new THREE.Vector3(vertex2.pos[0], vertex2.pos[1], vertex2.pos[2]));

            const vertexIndex3 = face.vertices[2];
            const vertex3 = this.vertices[vertexIndex3];
            this.geometry.vertices.push(new THREE.Vector3(vertex3.pos[0], vertex3.pos[1], vertex3.pos[2]));

            this.geometry.faces.push(new THREE.Face3(fi * 3, fi * 3 + 1, fi * 3 + 2));

            this.edges.push([vertexIndex1, vertexIndex2]);
            this.edges.push([vertexIndex1, vertexIndex3]);
            this.edges.push([vertexIndex2, vertexIndex3]);
        }
    }
}
