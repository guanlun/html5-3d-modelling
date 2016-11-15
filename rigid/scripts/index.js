const Constants = require('./Constants');
const Simulator = require('./Simulator');
const VecMath = require('./VecMath');
const scene = new THREE.Scene();

const WIDTH = 1000;
const HEIGHT = 600;

const props = {
    camera: null,
    cameraPos: {
        x: 10,
        y: 0,
        z: 0,
    },

    dragging: false,
    lastMousePos: null,

    pointLight: null,

    jelly: null,
}

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

let objectSimulators = [];
let method = 'Euler';
let stepSize = 0.05;

function loadObj(filename, initPos, initVel, callback) {
    const simulator = new Simulator();

    $.get(filename, objData => {
        const jellyObj = {};
        const vertices = [];

        const objLines = objData.split('\n');

        for (let i = 0; i < objLines.length; i++) {
            const line = objLines[i];

            if (line[0] === '#' || line[0] === 'o' || line[0] === 's') {
                continue;
            }

            const segs = line.split(' ');
            const dataType = segs[0];

            if (dataType === 'v') {
                simulator.addVertex([
                    parseFloat(segs[1]),
                    parseFloat(segs[2]),
                    parseFloat(segs[3]),
                ], initVel, segs[4] === 'y');
            } else if (dataType === 'f') {
                const face = {
                    vertices: [],
                };

                for (let vI = 1; vI < segs.length; vI++) {
                    const ref = segs[vI];

                    const vSegs = ref.split('/');
                    const vRef = parseInt(vSegs[0]) - 1;
                    const nRef = parseInt(vSegs[2]) - 1;

                    face.vertices.push(vRef);
                }

                simulator.addFace(face);
            }
        }

        simulator.computeCenterOfMass();
        simulator.recenter();
        simulator.computeMomentOfInertia();
        simulator.createGeometry(initPos);

        callback(simulator);
    });
}

renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

renderer.domElement.onwheel = (evt) => {
    evt.preventDefault(0);
    const multiplier = 1 + evt.deltaY * 0.001;

    props.cameraPos.x *= multiplier;
    props.cameraPos.z *= multiplier;
    props.cameraPos.y *= multiplier;

    props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
    props.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

renderer.domElement.onmousedown = (evt) => {
    props.dragging = true;

    props.lastMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };
}

renderer.domElement.onmousemove = (evt) => {
    if (!props.dragging) {
        return;
    }

    const currMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };

    const mousePosDiff = {
        x: currMousePos.x - props.lastMousePos.x,
        y: currMousePos.y - props.lastMousePos.y,
    };

    const distXZ = Math.sqrt(props.cameraPos.x * props.cameraPos.x + props.cameraPos.z * props.cameraPos.z);
    const dist = Math.sqrt(distXZ * distXZ + props.cameraPos.y * props.cameraPos.y);

    const currXZAngle = Math.atan2(props.cameraPos.z, props.cameraPos.x);
    const newXZAngle = currXZAngle + mousePosDiff.x / 57.3;
    const currYAngle = Math.atan2(props.cameraPos.y, distXZ);
    const newYAngle = currYAngle + mousePosDiff.y / 57.3;

    props.cameraPos.x = dist * Math.cos(newYAngle) * Math.cos(newXZAngle);
    props.cameraPos.z = dist * Math.cos(newYAngle) * Math.sin(newXZAngle);
    props.cameraPos.y = dist * Math.sin(newYAngle);

    props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
    props.camera.lookAt(new THREE.Vector3(0, 0, 0));

    props.lastMousePos = currMousePos;
}

renderer.domElement.onmouseup = (evt) => {
    props.dragging = false;
}

function initCamera() {
    props.camera = new THREE.PerspectiveCamera(
        75,
        WIDTH / HEIGHT,
        0.1,
        1000
    );

    props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
    props.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function initLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 10, -30);
    scene.add(directionalLight);

    props.pointLight = new THREE.PointLight(0xffffff, 1, 1);
    props.pointLight.position.set(0, 0, 10);
    scene.add(props.pointLight);
}

initCamera();
initLight();

function pointInTriangle(p, a, b, c) {
    const v0 = VecMath.sub(c, a);
    const v1 = VecMath.sub(b, a);
    const v2 = VecMath.sub(p, a);

    const dot00 = VecMath.dot(v0, v0);
    const dot01 = VecMath.dot(v0, v1);
    const dot02 = VecMath.dot(v0, v2);
    const dot11 = VecMath.dot(v1, v1);
    const dot12 = VecMath.dot(v1, v2);

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v < 1);
}

let simulating = false;

function checkCollsion(timestep, obj1, obj2) {
    const collisions = [];
    collisions.push(checkVertexFaceCollision(timestep, obj1, obj2));
    collisions.push(checkVertexFaceCollision(timestep, obj2, obj1));
    collisions.push(checkEdgeEdgeCollision(timestep, obj1, obj2));

    let earliestCollisionTime = Number.MAX_VALUE;
    let earliestCollision;

    for (let ci = 0; ci < collisions.length; ci++) {
        const collision = collisions[ci];

        if (collision && collision.time < earliestCollisionTime) {
            earliestCollisionTime = collision.time;

            earliestCollision = collision;
        }
    }

    return earliestCollision;
}

function getEdgeRelativeState(p1, p2, q1, q2) {
    const a = VecMath.sub(p2, p1);
    const a_u = VecMath.normalize(a);

    const b = VecMath.sub(q2, q1);
    const b_u = VecMath.normalize(b);

    const n_u = VecMath.normalize(VecMath.cross(a, b));

    const r = VecMath.sub(q1, p1);

    const crossBN = VecMath.cross(b_u, n_u);
    const crossAN = VecMath.cross(a_u, n_u);

    const s = VecMath.dot(r, crossBN) / VecMath.dot(a, crossBN);
    const t = -VecMath.dot(r, crossAN) / VecMath.dot(b, crossAN);

    if (s < 0 || s > 1 || t < 0 || t > 1) {
        return undefined;
    }

    const pa = VecMath.add(p1, VecMath.scalarMult(s, a));
    const qa = VecMath.add(q1, VecMath.scalarMult(t, b));

    const m = VecMath.sub(qa, pa);

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

function checkEdgeEdgeCollision(timestep, obj1, obj2) {
    let earliestCollisionTime = timestep;
    let collision;

    for (let i = 0; i < obj1.edges.length; i++) {
        const edge1 = obj1.edges[i];

        const p1 = obj1.vertices[edge1[0]].pos;
        const p2 = obj1.vertices[edge1[1]].pos;

        const lastP1 = obj1.lastState[edge1[0]].pos;
        const lastP2 = obj1.lastState[edge1[1]].pos;

        for (let j = 0; j < obj2.edges.length; j++) {
            const edge2 = obj2.edges[j];

            const q1 = obj2.vertices[edge2[0]].pos;
            const q2 = obj2.vertices[edge2[1]].pos;

            const lastQ1 = obj2.lastState[edge2[0]].pos;
            const lastQ2 = obj2.lastState[edge2[1]].pos;

            const currState = getEdgeRelativeState(p1, p2, q1, q2);
            const lastState = getEdgeRelativeState(lastP1, lastP2, lastQ1, lastQ2);

            if (currState === undefined || lastState === undefined) {
                continue;
            }

            const currDiff = currState.diff;
            const lastDiff = lastState.diff;

            const distDot = VecMath.dot(currDiff, lastDiff);

            if (distDot < 0) {
                const currDist = VecMath.dim(currDiff);
                const lastDist = VecMath.dim(lastDiff);

                const candidateCollisionTimeFraction = lastDist / (lastDist + currDist) * timestep;

                if (candidateCollisionTimeFraction < earliestCollisionTime) {
                    earliestCollisionTime = candidateCollisionTimeFraction;

                    collision = {
                        time: earliestCollisionTime,
                        type: 'edge-edge',
                        obj1: obj1,
                        obj2: obj2,
                        edge1: edge1,
                        edge2, edge2,
                        normal: currState.normal,
                        pos: currState.pa,
                    }
                }
            }
        }
    }

    return collision;
}

function checkVertexFaceCollision(timestep, obj1, obj2) {
    let earliestCollisionTime = timestep;
    let collision;

    for (let vi = 0; vi < obj1.vertices.length; vi++) {

        const vertex = obj1.vertices[vi];
        const vertexLastState = obj1.lastState[vi];

        for (let fi = 0; fi < obj2.faces.length; fi++) {
            const face = obj2.faces[fi];

            const faceV1 = obj2.vertices[face.vertices[0]];
            const faceV2 = obj2.vertices[face.vertices[1]];
            const faceV3 = obj2.vertices[face.vertices[2]];

            const lastFaceV1 = obj2.lastState[face.vertices[0]];
            const lastFaceV2 = obj2.lastState[face.vertices[1]];
            const lastFaceV3 = obj2.lastState[face.vertices[2]];

            const face12 = VecMath.sub(faceV2.pos, faceV1.pos);
            const face13 = VecMath.sub(faceV3.pos, faceV1.pos);

            const lastFace12 = VecMath.sub(lastFaceV2.pos, lastFaceV1.pos);
            const lastFace13 = VecMath.sub(lastFaceV3.pos, lastFaceV1.pos);

            const faceNormal = VecMath.normalize(VecMath.cross(face12, face13));
            const lastFaceNormal = VecMath.normalize(VecMath.cross(lastFace12, lastFace13));

            const currPosDot = VecMath.dot(faceNormal, VecMath.sub(vertex.pos, faceV1.pos));
            const lastPosDot = VecMath.dot(lastFaceNormal, VecMath.sub(vertexLastState.pos, lastFaceV1.pos));

            if (lastPosDot > 0 && currPosDot < 0) {
                const candidateCollisionTimeFraction = lastPosDot / (lastPosDot - currPosDot) * timestep;

                const collisionPos = VecMath.add(vertexLastState.pos, VecMath.scalarMult(candidateCollisionTimeFraction, vertex.vel));


                if (pointInTriangle(collisionPos, faceV1.pos, faceV2.pos, faceV3.pos)) {
                    if (candidateCollisionTimeFraction < earliestCollisionTime) {
                        earliestCollisionTime = candidateCollisionTimeFraction;

                        collision = {
                            time: earliestCollisionTime,
                            type: 'vertex-face',
                            vertex: vertex,
                            face: [faceV1, faceV2, faceV3],
                            normal: faceNormal,
                        };
                    }
                }
            }
        }
    }

    return collision;
}

let frame = 0;

function simulate() {
    frame++;
    if (simulating) {
        let timeRemaining = stepSize;
        let collision;

        let iter = 0;

        while (timeRemaining > 0 && iter < 10) {
            iter++;

            let timeSimulated = timeRemaining;

            objectSimulators.forEach(simulator => {
                simulator.simulate(method, timeRemaining, objectSimulators, true);
            });

            if (objectSimulators.length === 2) {
                const obj1 = objectSimulators[0];
                const obj2 = objectSimulators[1];

                const collision = checkCollsion(timeSimulated, obj2, obj1);

                if (collision) {
                    timeSimulated = collision.time;

                    objectSimulators.forEach(simulator => {
                        simulator.restoreState();
                    });

                    if (collision.type === 'vertex-face') {
                        const vertex = collision.vertex;
                        const faceVertices  = collision.face;
                        const normal = collision.normal;

                        vertex.vel = VecMath.scalarMult(-1, vertex.vel);

                        faceVertices.forEach(fv => {
                            fv.vel = VecMath.scalarMult(-0.1, normal);
                        });
                    } else if (collision.type === 'edge-edge') {
                        const normal = collision.normal;

                        const p1 = collision.obj1.vertices[collision.edge1[0]];
                        const p2 = collision.obj1.vertices[collision.edge1[1]];
                        const q1 = collision.obj2.vertices[collision.edge2[0]];
                        const q2 = collision.obj2.vertices[collision.edge2[1]];

                        const collisionVelocityMultiplier = (obj1.elasticity + obj2.elasticity) / 2;

                        p1.vel = VecMath.scalarMult(collisionVelocityMultiplier, normal);
                        p2.vel = VecMath.scalarMult(collisionVelocityMultiplier, normal);
                        q1.vel = VecMath.scalarMult(-collisionVelocityMultiplier, normal);
                        q2.vel = VecMath.scalarMult(-collisionVelocityMultiplier, normal);
                    }
                }
            }

            if (timeSimulated < timeRemaining) {
                objectSimulators.forEach(simulator => {
                    simulator.simulate(method, timeSimulated, objectSimulators);
                });
            }

            timeRemaining -= timeSimulated;
        }
    }

    renderer.render(scene, props.camera);

    requestAnimationFrame(simulate);
}
simulate();

const meshes = [];

const startPauseBtn = $('#start-pause-btn');
startPauseBtn.click(e => {
    simulating = !simulating;
});

const loadPreset1Btn = $('#load-preset-1-btn');
loadPreset1Btn.click(e => {
    objectSimulators = [];
    meshes.forEach(m => {
        scene.remove(m);
    });

    loadObj('obj/box.obj', [0, 5, 0], [0, 0, 0], obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        const mesh = new THREE.Mesh(obj.geometry, new THREE.MeshBasicMaterial({
            color: 'red',
            wireframe: true,
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });
});

const loadPreset2Btn = $('#load-preset-2-btn');
loadPreset2Btn.click(e => {
});

const loadPreset3Btn = $('#load-preset-3-btn');
loadPreset3Btn.click(e => {
});

const stepSizeSlider = $('#step-size-slider');
stepSizeSlider.change(e => {
    stepSize = stepSizeSlider.val();
});

const methodSelect = $('#method-select');
methodSelect.change(e => {
    method = methodSelect.val();
});
