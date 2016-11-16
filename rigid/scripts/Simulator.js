const ObjectState = require('./ObjectState');

function pointInTriangle(p, a, b, c) {
    const v0 = math.subtract(c, a);
    const v1 = math.subtract(b, a);
    const v2 = math.subtract(p, a);

    const dot00 = math.dot(v0, v0);
    const dot01 = math.dot(v0, v1);
    const dot02 = math.dot(v0, v2);
    const dot11 = math.dot(v1, v1);
    const dot12 = math.dot(v1, v2);

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v < 1);
}

function getEdgeRelativeState(p1, p2, q1, q2) {
    const a = math.subtract(p2, p1);
    const a_u = math.normalize(a);

    const b = math.subtract(q2, q1);
    const b_u = math.normalize(b);

    const n_u = math.normalize(math.cross(a, b));

    const r = math.subtract(q1, p1);

    const crossBN = math.cross(b_u, n_u);
    const crossAN = math.cross(a_u, n_u);

    const s = math.dot(r, crossBN) / math.dot(a, crossBN);
    const t = -math.dot(r, crossAN) / math.dot(b, crossAN);

    if (s < 0 || s > 1 || t < 0 || t > 1) {
        return undefined;
    }

    const pa = math.add(p1, math.multiply(s, a));
    const qa = math.add(q1, math.multiply(t, b));

    const m = math.subtract(qa, pa);

    return {
        normal: n_u,
        diff: m,
        pa: pa,
        qa: qa,
        s: s,
        t: t,
        a: a,
        b: b,
    };
}

module.exports = class Simulator {
    constructor() {
        this.vertices = [];
        this.faces = [];
        this.edges = [];

        this.mass = 1;
        this.c_r = 0.9;

        this.globalVertexPos = [];
        this.lastGlobalVertexPos =[];

        this.state = undefined;
    }

    restoreState() {
        this.state = this.lastState;
        this.globalVertexPos = this.lastGlobalVertexPos;
    }

    updateState(state) {
        this.state = state;

        this.globalVertexPos = [];

        const objPos = state.x;
        const objRotation = state.r;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const p = this.vertices[vi].pos;

            const worldPos = math.add(objPos, math.multiply(objRotation, p))._data;

            this.globalVertexPos[vi] = worldPos;
        }
    }

    euler(t) {
        const dState = this.computeDerivative(this.state, t);

        this.updateState(this.applyStateDerivative(this.state, dState, t));
    }

    rk2(t) {
        const dState = this.computeDerivative(this.state, t / 2);
        const halfPosState = this.applyStateDerivative(this.state, dState, t / 2);

        const secondOrderState = this.computeDerivative(halfPosState, t);

        this.updateState(this.applyStateDerivative(this.state, secondOrderState, t));
    }

    computeDerivative(state, mass) {
        const dState = new ObjectState();

        dState.x = math.divide(state.p, mass);

        const inverseI0 = math.inv(this.momentOfIntertia);
        const inverseI = math.multiply(math.multiply(state.r, inverseI0), math.transpose(state.r));

        const w = math.multiply(inverseI, state.l)._data;
        const wMtx = new math.matrix([
            [0, -w[2], w[1]],
            [w[2], 0, -w[0]],
            [-w[1], w[0], 0],
        ]);

        dState.r = math.multiply(wMtx, state.r);

        dState.p = [0, -1, 0];
        dState.l = [0, 0, 0];

        return dState;
    }

    applyStateDerivative(state, dState, h) {
        const newState = new ObjectState();

        newState.x = math.add(state.x, math.multiply(dState.x, h));
        newState.p = math.add(state.p, math.multiply(dState.p, h));
        newState.r = math.add(state.r, math.multiply(dState.r, h));
        newState.l = math.add(state.l, math.multiply(dState.l, h));

        return newState;
    }

    simulate(method, t) {
        if (!this.geometry) {
            return;
        }

        // TODO: problem?
        this.lastState = this.state;
        this.lastGlobalVertexPos = this.globalVertexPos;

        if (method === 'Euler') {
            this.euler(t);
        } else {
            this.rk2(t);
        }

        this.updateGeometry();
    }

    checkBasePlaneCollision(timestep) {
        const lastState = this.lastState;
        const newState = this.state;

        const lastObjPos = lastState.x;
        const lastObjRotation = lastState.r;

        const newObjPos = newState.x;
        const newObjRotation = newState.r;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const p = this.vertices[vi].pos;

            const lastWorldPos = this.lastGlobalVertexPos[vi];
            const newWorldPos = this.globalVertexPos[vi];

            const lastY = lastWorldPos[1];
            const newY = newWorldPos[1];

            if (lastY > 0 && newY <= 0) {
                return {
                    type: 'static-plane',
                    obj: this,
                    time: lastY / (lastY - newY) * timestep,
                    normal: [0, 1, 0],
                    // TODO: using last state is not accurate
                    r_a: math.subtract(lastWorldPos, lastState.x),
                };
            }
        }
    }

    checkVertexFaceCollision(timestep, obj) {
        let earliestCollisionTime = timestep;
        let collision;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const p = this.vertices[vi].pos;

            const lastWorldPos = this.lastGlobalVertexPos[vi];
            const newWorldPos = this.globalVertexPos[vi];

            for (let fi = 0; fi < obj.faces.length; fi++) {
                const face = obj.faces[fi];

                const faceV1 = obj.vertices[face.vertices[0]].pos;
                const faceV2 = obj.vertices[face.vertices[1]].pos;
                const faceV3 = obj.vertices[face.vertices[2]].pos;

                // Face vertex positions
                const lastV1WorldPos = obj.lastGlobalVertexPos[face.vertices[0]];
                const newV1WorldPos = obj.globalVertexPos[face.vertices[0]];

                const lastV2WorldPos = obj.lastGlobalVertexPos[face.vertices[1]];
                const newV2WorldPos = obj.globalVertexPos[face.vertices[1]];

                const lastV3WorldPos = obj.lastGlobalVertexPos[face.vertices[2]];
                const newV3WorldPos = obj.globalVertexPos[face.vertices[2]];

                // Edge vectors
                const lastFace12 = math.subtract(lastV2WorldPos, lastV1WorldPos);
                const lastFace13 = math.subtract(lastV3WorldPos, lastV1WorldPos);

                const newFace12 = math.subtract(newV2WorldPos, newV1WorldPos);
                const newFace13 = math.subtract(newV3WorldPos, newV1WorldPos);

                const lastFaceNormal = math.normalize(math.cross(lastFace12, lastFace13));
                const newFaceNormal = math.normalize(math.cross(newFace12, newFace13));

                const lastPosDot = math.dot(lastFaceNormal, math.subtract(lastWorldPos, lastV1WorldPos));
                const newPosDot = math.dot(newFaceNormal, math.subtract(newWorldPos, newV1WorldPos));

                if (lastPosDot > 0 && newPosDot <= 0) {
                    const candidateCollisionTimeFraction = lastPosDot / (lastPosDot - newPosDot) * timestep;

                    // const collisionPos = math.add(lastWorldPos, math.multiply(candidateCollisionTimeFraction, vertex.vel));

                    // TODO:
                    const collisionPos = lastWorldPos;

                    if (pointInTriangle(collisionPos, lastV1WorldPos, lastV2WorldPos, lastV3WorldPos)) {
                        if (candidateCollisionTimeFraction < earliestCollisionTime) {
                            earliestCollisionTime = candidateCollisionTimeFraction;

                            collision = {
                                time: earliestCollisionTime,
                                type: 'vertex-face',
                                // vertex: vertex,
                                // face: [faceV1, faceV2, faceV3],
                                normal: lastFaceNormal,
                                obj1: this,
                                obj2: obj,
                                r_a: math.subtract(collisionPos, this.state.x),
                                r_b: math.subtract(collisionPos, obj.state.x),
                            };
                        }
                    }
                }
            }
        }

        return collision;
    }

    checkEdgeEdgeCollision(timestep, obj) {
        let earliestCollisionTime = timestep;
        let collision;

        for (let i = 0; i < this.edges.length; i++) {
            const edge1 = this.edges[i];

            const lastWorldP1 = this.lastGlobalVertexPos[edge1[0]];
            const newWorldP1 = this.globalVertexPos[edge1[0]];

            const lastWorldP2 = this.lastGlobalVertexPos[edge1[1]];
            const newWorldP2 = this.globalVertexPos[edge1[1]];

            for (let j = 0; j < obj.edges.length; j++) {
                const edge2 = obj.edges[j];

                const lastWorldQ1 = obj.lastGlobalVertexPos[edge2[0]];
                const newWorldQ1 = obj.globalVertexPos[edge2[0]];

                const lastWorldQ2 = obj.lastGlobalVertexPos[edge2[1]];
                const newWorldQ2 = obj.globalVertexPos[edge2[1]];

                const newState = getEdgeRelativeState(newWorldP1, newWorldP2, newWorldQ1, newWorldQ2);
                const lastState = getEdgeRelativeState(lastWorldP1, lastWorldP2, lastWorldQ1, lastWorldQ2);

                if (newState === undefined || lastState === undefined) {
                    continue;
                }

                const newDiff = newState.diff;
                const lastDiff = lastState.diff;

                const distDot = math.dot(newDiff, lastDiff);

                if (distDot < 0) {
                    const newDist = math.norm(newDiff);
                    const lastDist = math.norm(lastDiff);

                    const candidateCollisionTimeFraction = lastDist / (lastDist + newDist) * timestep;

                    if (candidateCollisionTimeFraction < earliestCollisionTime) {
                        earliestCollisionTime = candidateCollisionTimeFraction;

                        const collisionPos = newState.pa;

                        collision = {
                            time: earliestCollisionTime,
                            type: 'edge-edge',
                            normal: newState.normal,
                            obj1: this,
                            obj2: obj,
                            r_a: math.subtract(collisionPos, this.state.x),
                            r_b: math.subtract(collisionPos, obj.state.x),
                        };

                        // console.log(collision);
                    }
                }
            }
        }

        return collision;
    }

    getAABB() {
        let minX = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        let minZ = Number.MAX_VALUE;
        let maxZ = -Number.MAX_VALUE;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const vertex = this.globalVertexPos[vi];

            if (vertex[0] > maxX) {
                maxX = vertex[0];
            }

            if (vertex[0] < minX) {
                minX = vertex[0];
            }

            if (vertex[1] > maxY) {
                maxY = vertex[1];
            }

            if (vertex[1] < minY) {
                minY = vertex[1];
            }

            if (vertex[2] > maxZ) {
                maxZ = vertex[2];
            }

            if (vertex[2] < minZ) {
                minZ = vertex[2];
            }
        }

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
            minZ: minZ,
            maxZ: maxZ,
        };
    }

    addFace(face) {
        this.faces.push(face);
    }

    addVertex(vertexPos) {
        const vertexData = {
            pos: vertexPos,
            isStatic: false,
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

        this.pointsInObject = [];

        for (let x = minX; x <= maxX; x += xStep) {
            for (let y = minY; y <= maxY; y += yStep) {
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
                        this.pointsInObject.push([x, y, z]);
                    }

                    lastZ = z;
                }
            }
        }

        let aggr = [0, 0, 0];

        for (let pi = 0; pi < this.pointsInObject.length; pi++) {
            const point = this.pointsInObject[pi];

            aggr = math.add(aggr, point);
        }

        this.centerOfMass = math.divide(aggr, this.pointsInObject.length);
    }

    recenter() {
        const cos = this.centerOfMass;

        for (let vi = 0; vi < this.vertices.length; vi++) {
            const p = this.vertices[vi].pos;
            p[0] -= cos[0];
            p[1] -= cos[1];
            p[2] -= cos[2];
        }

        for (let pi = 0; pi < this.pointsInObject.length; pi++) {
            const point = this.pointsInObject[pi];

            point[0] -= cos[0];
            point[1] -= cos[1];
            point[2] -= cos[2];
        }
    }

    computeMomentOfInertia() {
        const m = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];

        for (let pi = 0; pi < this.pointsInObject.length; pi++) {
            const point = this.pointsInObject[pi];
            const x = point[0];
            const y = point[1];
            const z = point[2];

            m[0][0] += y * y + z * z;
            m[0][1] -= x * y;
            m[0][2] -= x * z;
            m[1][0] -= x * y;
            m[1][1] += x * x + z * z;
            m[1][2] -= y * z;
            m[2][0] -= x * z;
            m[2][1] -= y * z;
            m[2][2] += x * x + y * y;
        }

        const aggr = new math.matrix(m);
        const massPerPoint = this.mass / this.pointsInObject.length;

        this.momentOfIntertia = math.multiply(aggr, massPerPoint);
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

        this.geometry.verticesNeedUpdate = true;
    }

    createGeometry(initPos, initRotation, initVel) {
        const initialState = new ObjectState();

        initialState.p = math.multiply(this.mass, initVel);
        initialState.x = math.add(initialState.x, initPos);
        initialState.r = math.matrix(initRotation);

        this.updateState(initialState);

        const globalPos = this.state.x;

        this.geometry = new THREE.Geometry();

        const vertexFaceLookup = {};

        for (let fi = 0; fi < this.faces.length; fi++) {
            const face = this.faces[fi];

            const vertexIndex1 = face.vertices[0];
            const vertex1 = this.vertices[vertexIndex1];
            this.geometry.vertices.push(new THREE.Vector3(
                vertex1.pos[0] + globalPos[0],
                vertex1.pos[1] + globalPos[1],
                vertex1.pos[2] + globalPos[2]
            ));

            const vertexIndex2 = face.vertices[1];
            const vertex2 = this.vertices[vertexIndex2];
            this.geometry.vertices.push(new THREE.Vector3(
                vertex2.pos[0] + globalPos[0],
                vertex2.pos[1] + globalPos[1],
                vertex2.pos[2] + globalPos[2]
            ));

            const vertexIndex3 = face.vertices[2];
            const vertex3 = this.vertices[vertexIndex3];
            this.geometry.vertices.push(new THREE.Vector3(
                vertex3.pos[0] + globalPos[0],
                vertex3.pos[1] + globalPos[1],
                vertex3.pos[2] + globalPos[2]
            ));

            this.geometry.faces.push(new THREE.Face3(fi * 3, fi * 3 + 1, fi * 3 + 2));

            this.edges.push([vertexIndex1, vertexIndex2]);
            this.edges.push([vertexIndex1, vertexIndex3]);
            this.edges.push([vertexIndex2, vertexIndex3]);
        }
    }
}
