var ObjectState = require('./ObjectState');

function pointInTriangle(p, a, b, c) {
    var v0 = math.subtract(c, a);
    var v1 = math.subtract(b, a);
    var v2 = math.subtract(p, a);

    var dot00 = math.dot(v0, v0);
    var dot01 = math.dot(v0, v1);
    var dot02 = math.dot(v0, v2);
    var dot11 = math.dot(v1, v1);
    var dot12 = math.dot(v1, v2);

    var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v < 1);
}

function getEdgeRelativeState(p1, p2, q1, q2) {
    var a = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    var a_u = math.normalize(a);

    var b = [q2[0] - q1[0], q2[1] - q1[1], q2[2] - q1[2]];
    var b_u = math.normalize(b);

    var n_u = math.normalize(math._cross(a, b));

    var r = [q1[0] - p1[0], q1[1] - p1[1], q1[2] - p1[2]];

    var crossBN = math._cross(b_u, n_u);
    var crossAN = math._cross(a_u, n_u);

    // var _crossBN = math._cross(b_u, n_u);
    //
    // if (crossBN[0] !== _crossBN[0] || crossBN[1] !== _crossBN[1] || crossBN[2] !== _crossBN[2]) {
    //     console.log(crossBN, _crossBN);
    // }

    var s = math.dot(r, crossBN) / math.dot(a, crossBN);
    var t = -math.dot(r, crossAN) / math.dot(b, crossAN);

    if (s < 0 || s > 1 || t < 0 || t > 1) {
        return undefined;
    }

    var pa = math.add(p1, math.multiply(s, a));
    var qa = math.add(q1, math.multiply(t, b));

    var m = math.subtract(qa, pa);

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
        this.c_r = 0.4;

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

        var objPos = state.x;
        var objRotation = state.r;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var p = this.vertices[vi].pos;

            var worldPos = math.add(objPos, math.multiply(objRotation, p))._data;

            this.globalVertexPos[vi] = worldPos;
        }
    }

    euler(t) {
        var dState = this.computeDerivative(this.state);

        this.updateState(this.applyStateDerivative(this.state, dState, t));
    }

    rk2(t) {
        var dState = this.computeDerivative(this.state);
        var halfPosState = this.applyStateDerivative(this.state, dState, t / 2);

        var secondOrderState = this.computeDerivative(halfPosState);

        this.updateState(this.applyStateDerivative(this.state, secondOrderState, t));
    }

    computeDerivative(state) {
        var dState = new ObjectState();

        dState.x = math.divide(state.p, this.mass);

        var inverseI0 = math.inv(this.momentOfIntertia);
        var inverseI = math.multiply(math.multiply(state.r, inverseI0), math.transpose(state.r));

        var w = math.multiply(inverseI, state.l)._data;
        var wMtx = new math.matrix([
            [0, -w[2], w[1]],
            [w[2], 0, -w[0]],
            [-w[1], w[0], 0],
        ]);

        dState.r = math.multiply(wMtx, state.r);

        dState.p = [0, -1, 0];

        var yVel = state.p[1] / this.mass;

        // if (Math.abs(yVel) < 0.01) {
        //     console.log(yVel);
        // }

        dState.l = [0, 0, 0];

        return dState;
    }

    applyStateDerivative(state, dState, h) {
        var newState = new ObjectState();

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
        var lastState = this.lastState;
        var newState = this.state;

        var lastObjPos = lastState.x;
        var lastObjRotation = lastState.r;

        var newObjPos = newState.x;
        var newObjRotation = newState.r;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var p = this.vertices[vi].pos;

            var lastWorldPos = this.lastGlobalVertexPos[vi];
            var newWorldPos = this.globalVertexPos[vi];

            var lastY = lastWorldPos[1];
            var newY = newWorldPos[1];

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
        var earliestCollisionTime = timestep;
        var collision;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var p = this.vertices[vi].pos;

            var lastWorldPos = this.lastGlobalVertexPos[vi];
            var newWorldPos = this.globalVertexPos[vi];

            for (var fi = 0; fi < obj.faces.length; fi++) {
                var face = obj.faces[fi];

                var faceV1 = obj.vertices[face.vertices[0]].pos;
                var faceV2 = obj.vertices[face.vertices[1]].pos;
                var faceV3 = obj.vertices[face.vertices[2]].pos;

                // Face vertex positions
                var lastV1WorldPos = obj.lastGlobalVertexPos[face.vertices[0]];
                var newV1WorldPos = obj.globalVertexPos[face.vertices[0]];

                var lastV2WorldPos = obj.lastGlobalVertexPos[face.vertices[1]];
                var newV2WorldPos = obj.globalVertexPos[face.vertices[1]];

                var lastV3WorldPos = obj.lastGlobalVertexPos[face.vertices[2]];
                var newV3WorldPos = obj.globalVertexPos[face.vertices[2]];

                // Edge vectors
                var lastFace12 = math.subtract(lastV2WorldPos, lastV1WorldPos);
                var lastFace13 = math.subtract(lastV3WorldPos, lastV1WorldPos);

                var newFace12 = math.subtract(newV2WorldPos, newV1WorldPos);
                var newFace13 = math.subtract(newV3WorldPos, newV1WorldPos);

                var lastFaceNormal = math.normalize(math._cross(lastFace12, lastFace13));
                var newFaceNormal = math.normalize(math._cross(newFace12, newFace13));

                var lastPosDot = math.dot(lastFaceNormal, math.subtract(lastWorldPos, lastV1WorldPos));
                var newPosDot = math.dot(newFaceNormal, math.subtract(newWorldPos, newV1WorldPos));

                if (lastPosDot > 0 && newPosDot <= 0) {
                    var candidateCollisionTimeFraction = lastPosDot / (lastPosDot - newPosDot) * timestep;

                    // var collisionPos = math.add(lastWorldPos, math.multiply(candidateCollisionTimeFraction, vertex.vel));

                    // TODO:
                    var collisionPos = lastWorldPos;

                    if (pointInTriangle(collisionPos, lastV1WorldPos, lastV2WorldPos, lastV3WorldPos)) {
                        if (candidateCollisionTimeFraction < earliestCollisionTime) {
                            earliestCollisionTime = candidateCollisionTimeFraction;

                            collision = {
                                time: earliestCollisionTime,
                                type: 'vertex-face',
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
        var earliestCollisionTime = timestep;
        var collision;

        for (var i = 0; i < this.edges.length; i++) {
            var edge1 = this.edges[i];

            var lastWorldP1 = this.lastGlobalVertexPos[edge1[0]];
            var newWorldP1 = this.globalVertexPos[edge1[0]];

            var lastWorldP2 = this.lastGlobalVertexPos[edge1[1]];
            var newWorldP2 = this.globalVertexPos[edge1[1]];

            for (var j = 0; j < obj.edges.length; j++) {
                var edge2 = obj.edges[j];

                var lastWorldQ1 = obj.lastGlobalVertexPos[edge2[0]];
                var newWorldQ1 = obj.globalVertexPos[edge2[0]];

                var lastWorldQ2 = obj.lastGlobalVertexPos[edge2[1]];
                var newWorldQ2 = obj.globalVertexPos[edge2[1]];

                var newState = getEdgeRelativeState(newWorldP1, newWorldP2, newWorldQ1, newWorldQ2);
                var lastState = getEdgeRelativeState(lastWorldP1, lastWorldP2, lastWorldQ1, lastWorldQ2);

                if (newState === undefined || lastState === undefined) {
                    continue;
                }

                var newDiff = newState.diff;
                var lastDiff = lastState.diff;

                var distDot = math.dot(newDiff, lastDiff);

                if (distDot < 0) {
                    var newDist = math.norm(newDiff);
                    var lastDist = math.norm(lastDiff);

                    var candidateCollisionTimeFraction = lastDist / (lastDist + newDist) * timestep;

                    if (candidateCollisionTimeFraction < earliestCollisionTime) {
                        earliestCollisionTime = candidateCollisionTimeFraction;

                        var collisionPos = newState.pa;

                        collision = {
                            time: earliestCollisionTime,
                            type: 'edge-edge',
                            normal: newState.normal,
                            obj1: this,
                            obj2: obj,
                            r_a: math.subtract(collisionPos, this.state.x),
                            r_b: math.subtract(collisionPos, obj.state.x),
                        };
                    }
                }
            }
        }

        return collision;
    }

    getAABB() {
        var minX = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE;
        var minZ = Number.MAX_VALUE;
        var maxZ = -Number.MAX_VALUE;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var vertex = this.globalVertexPos[vi];

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
        var vertexData = {
            pos: vertexPos,
            isStatic: false,
        };
        this.vertices.push(vertexData);
    }

    computeCenterOfMass() {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var minZ = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE
        var maxZ = -Number.MAX_VALUE;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var p = this.vertices[vi].pos;

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

        var xStep = (maxX - minX) / 10;
        var yStep = (maxY - minY) / 10;
        var zStep = (maxZ - minZ) / 10;

        this.pointsInObject = [];

        for (var x = minX; x <= maxX; x += xStep) {
            for (var y = minY; y <= maxY; y += yStep) {
                var zIntersectionIndices = [];

                for (var fi = 0; fi < this.faces.length; fi++) {
                    var triangleVertices = this.faces[fi].vertices;
                    var v1 = this.vertices[triangleVertices[0]].pos;
                    var v2 = this.vertices[triangleVertices[1]].pos;
                    var v3 = this.vertices[triangleVertices[2]].pos;

                    var v12 = math.subtract(v2, v1);
                    var v13 = math.subtract(v3, v1);

                    var xDiff = x - v1[0];
                    var yDiff = y - v1[1];

                    var m = v12[0];
                    var n = v12[1];
                    var p = v13[0];
                    var q = v13[1];

                    var b = (m * yDiff - xDiff * n) / (m * q - n * p);
                    var a = (xDiff - b * p) / m;

                    var c = 1 - a - b;

                    if (a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1) {
                        var zPos = a * v12[2] + b * v13[2] + v1[2];

                        zIntersectionIndices.push(zPos);
                    }
                }

                zIntersectionIndices.sort();

                var isInside = false;

                var lastZ = minZ;

                var currIntersectIndex = 0;

                for (var z = minZ; z <= maxZ; z += zStep) {
                    var currIntersectZ = zIntersectionIndices[currIntersectIndex];

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

        var aggr = [0, 0, 0];

        for (var pi = 0; pi < this.pointsInObject.length; pi++) {
            var point = this.pointsInObject[pi];

            aggr = math.add(aggr, point);
        }

        this.centerOfMass = math.divide(aggr, this.pointsInObject.length);
    }

    recenter() {
        var cos = this.centerOfMass;

        for (var vi = 0; vi < this.vertices.length; vi++) {
            var p = this.vertices[vi].pos;
            p[0] -= cos[0];
            p[1] -= cos[1];
            p[2] -= cos[2];
        }

        for (var pi = 0; pi < this.pointsInObject.length; pi++) {
            var point = this.pointsInObject[pi];

            point[0] -= cos[0];
            point[1] -= cos[1];
            point[2] -= cos[2];
        }
    }

    computeMomentOfInertia() {
        var m = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];

        for (var pi = 0; pi < this.pointsInObject.length; pi++) {
            var point = this.pointsInObject[pi];
            var x = point[0];
            var y = point[1];
            var z = point[2];

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

        var aggr = new math.matrix(m);
        var massPerPoint = this.mass / this.pointsInObject.length;

        this.momentOfIntertia = math.multiply(aggr, massPerPoint);
    }

    updateGeometry() {
        var globalPos = this.state.x;
        var globalRotation = this.state.r;

        for (var fi = 0; fi < this.faces.length; fi++) {
            var face =  this.faces[fi];

            var vertexIndex = face.vertices[0];
            var vertex = this.vertices[vertexIndex];
            var worldPos = math.add(globalPos, math.multiply(globalRotation, vertex.pos));
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

    createGeometry(initPos, initRotation, initVel, initAngularVel) {
        var initialState = new ObjectState();

        initialState.x = math.add(initialState.x, initPos);
        initialState.p = math.multiply(this.mass, initVel);
        initialState.r = math.matrix(initRotation);
        initialState.l = math.multiply(this.momentOfIntertia, initAngularVel);

        this.updateState(initialState);

        var globalPos = this.state.x;

        this.geometry = new THREE.Geometry();

        var vertexFaceLookup = {};

        for (var fi = 0; fi < this.faces.length; fi++) {
            var face = this.faces[fi];

            var vertexIndex1 = face.vertices[0];
            var vertex1 = this.vertices[vertexIndex1];
            this.geometry.vertices.push(new THREE.Vector3(
                vertex1.pos[0] + globalPos[0],
                vertex1.pos[1] + globalPos[1],
                vertex1.pos[2] + globalPos[2]
            ));

            var vertexIndex2 = face.vertices[1];
            var vertex2 = this.vertices[vertexIndex2];
            this.geometry.vertices.push(new THREE.Vector3(
                vertex2.pos[0] + globalPos[0],
                vertex2.pos[1] + globalPos[1],
                vertex2.pos[2] + globalPos[2]
            ));

            var vertexIndex3 = face.vertices[2];
            var vertex3 = this.vertices[vertexIndex3];
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
