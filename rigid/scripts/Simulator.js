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

module.exports = class Simulator {
    constructor() {
        this.state = new ObjectState();

        this.vertices = [];
        this.faces = [];
        this.edges = [];

        this.mass = 1;
        this.c_r = 0.3;
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
        this.state = this.lastState;
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
        const dState = this.computeDerivative(this.state, t);

        this.state = this.applyStateDerivative(this.state, dState, t);
    }

    rk2(t) {
        const dState = this.computeDerivative(this.state, t / 2);
        const halfPosState = this.applyStateDerivative(this.state, dState, t / 2);

        const secondOrderState = this.computeDerivative(halfPosState, t);

        this.state = this.applyStateDerivative(this.state, secondOrderState, t);
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

        this.lastState = this.state;


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

            const lastWorldPos = math.add(lastObjPos, math.multiply(lastObjRotation, p))._data;
            const newWorldPos = math.add(newObjPos, math.multiply(newObjRotation, p))._data;

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

            const lastWorldPos = math.add(this.lastState.x, math.multiply(this.lastState.r, p))._data;
            const newWorldPos = math.add(this.state.x, math.multiply(this.state.r, p))._data;

            for (let fi = 0; fi < obj.faces.length; fi++) {
                const face = obj.faces[fi];

                const faceV1 = obj.vertices[face.vertices[0]].pos;
                const faceV2 = obj.vertices[face.vertices[1]].pos;
                const faceV3 = obj.vertices[face.vertices[2]].pos;

                // Face vertex positions
                const lastV1WorldPos = math.add(obj.lastState.x, math.multiply(obj.lastState.r, faceV1))._data;
                const newV1WorldPos = math.add(obj.state.x, math.multiply(obj.state.r, faceV1))._data;

                const lastV2WorldPos = math.add(obj.lastState.x, math.multiply(obj.lastState.r, faceV2))._data;
                const newV2WorldPos = math.add(obj.state.x, math.multiply(obj.state.r, faceV2))._data;

                const lastV3WorldPos = math.add(obj.lastState.x, math.multiply(obj.lastState.r, faceV3))._data;
                const newV3WorldPos = math.add(obj.state.x, math.multiply(obj.state.r, faceV3))._data;

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

    respondToCollision(collision) {
        // console.log(collision);
        if (collision.type === 'static-plane') {
            if (collision.obj == this) {
                const {
                    r_a,
                    normal,
                } = collision;

                const v_before = math.divide(this.state.p, this.mass);
                const v_normal_before = math.dot(v_before, normal);

                // TODO: optimize
                const inverseI0 = math.inv(this.momentOfIntertia);
                const inverseI = math.multiply(math.multiply(this.state.r, inverseI0), math.transpose(this.state.r));

                const n = -(1 + this.c_r) * v_normal_before;
                const d = 1 / this.mass + math.dot(normal, math.cross(math.multiply(inverseI, math.cross(r_a, normal)), r_a));
                const j = n / d;

                const deltaP = math.multiply(3 * j, normal);
                const deltaL = math.multiply(3, math.cross(r_a, deltaP));

                // this.state.p = math.add(this.state.p, deltaP);
                this.state.p = math.multiply(-this.c_r, this.state.p)
                this.state.l = math.add(this.state.l, deltaL);


                // console.log('--------------------');
            }
        } else {
            if (collision.obj1 == this || collision.obj2 == this) {
                const {
                    obj1,
                    obj2,
                    r_a,
                    r_b,
                    normal,
                } = collision;

                const v_before = math.divide(math.subtract(obj1.state.p, obj2.state.p), this.mass);
                const v_normal_before = math.dot(v_before, normal);

                const inverseIA0 = math.inv(obj1.momentOfIntertia);
                const inverseIA = math.multiply(math.multiply(obj1.state.r, inverseIA0), math.transpose(obj1.state.r));

                const inverseIB0 = math.inv(obj2.momentOfIntertia);
                const inverseIB = math.multiply(math.multiply(obj2.state.r, inverseIB0), math.transpose(obj2.state.r));

                const n = -(1 + this.c_r) * v_normal_before;
                const d = 1 / obj1.mass + 1 / obj2.mass +
                        math.dot(normal,
                            math.add(
                                math.cross(math.multiply(inverseIA, math.cross(r_a, normal)), r_a),
                                math.cross(math.multiply(inverseIB, math.cross(r_b, normal)), r_b)
                            )
                        );

                const j = n / d;

                const deltaP = math.multiply(1 * j, normal);
                const deltaL = math.multiply(1, math.cross(r_a, deltaP));

                obj1.state.p = math.add(obj1.state.p, math.multiply(3, deltaP));
                obj1.state.l = math.add(obj1.state.l, math.multiply(3, deltaL));

                obj2.state.p = math.add(obj2.state.p, math.multiply(-3, deltaP));
                obj2.state.l = math.add(obj2.state.l, math.multiply(-3, deltaL));
            }

            // this.state.p = math.multiply(-1, this.state.p);
        }
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

    createGeometry(initPos, initVel) {
        this.state.p = math.multiply(this.mass, initVel);
        this.state.x = math.add(this.state.x, initPos);

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
