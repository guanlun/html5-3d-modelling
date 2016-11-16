math.normalize = (vec) => {
    const dim = math.norm(vec);

    const ret = [];

    for (let i = 0; i < vec.length; i++) {
        ret[i] = vec[i] / dim;
    }

    return ret;
}

const Simulator = require('./Simulator');
const scene = new THREE.Scene();

const WIDTH = 1000;
const HEIGHT = 600;

const props = {
    camera: null,
    cameraPos: {
        x: 10,
        y: 2,
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
let stepSize = 0.001;

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
                ]);
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
        simulator.createGeometry(initPos, initVel);

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

let simulating = false;

function checkCollsion(timestep, objects) {
    let earliestCollisionTime = Number.MAX_VALUE;
    let earliestCollision;

    const vertexFaceCollision = checkVertexFaceCollision(timestep, objects);

    // console.log(vertexFaceCollision);

    if (vertexFaceCollision) {
        earliestCollision = vertexFaceCollision;
        earliestCollisionTime = vertexFaceCollision.time;
    }

    for (let oi = 0; oi < objects.length; oi++) {
        const obj = objects[oi];

        const basePlaneCollision = obj.checkBasePlaneCollision(timestep);

        if (basePlaneCollision) {
            if (basePlaneCollision && basePlaneCollision.time < earliestCollisionTime) {
                earliestCollisionTime = basePlaneCollision.time;

                earliestCollision = basePlaneCollision;
            }
        }
    }

    return earliestCollision;


    // const collisions = [];
    // collisions.push(checkVertexFaceCollision(timestep, obj1, obj2));
    // collisions.push(checkVertexFaceCollision(timestep, obj2, obj1));
    // collisions.push(checkEdgeEdgeCollision(timestep, obj1, obj2));
    //
    // let earliestCollisionTime = Number.MAX_VALUE;
    // let earliestCollision;
    //
    // for (let ci = 0; ci < collisions.length; ci++) {
    //     const collision = collisions[ci];
    //
    //     if (collision && collision.time < earliestCollisionTime) {
    //         earliestCollisionTime = collision.time;
    //
    //         earliestCollision = collision;
    //     }
    // }
    //
    // return earliestCollision;
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

            const distDot = math.dot(currDiff, lastDiff);

            if (distDot < 0) {
                const currDist = math.norm(currDiff);
                const lastDist = math.norm(lastDiff);

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

function checkVertexFaceCollision(timestep, objects) {
    const c1 = objects[0].checkVertexFaceCollision(timestep, objects[1]);
    const c2 = objects[1].checkVertexFaceCollision(timestep, objects[0]);

    // TODO
    if (c1) {
        return c1;
    } else {
        return c1;
    }
}

let frame = 0;

function simulate() {
    frame++;
    if (simulating) {
        let timeRemaining = stepSize;
        let collision;

        let iter = 0;

        while (timeRemaining > (0.01 * stepSize) && iter < 10) {
            iter++;

            let timeSimulated = timeRemaining;

            objectSimulators.forEach(simulator => {
                simulator.simulate(method, timeRemaining);
            });

            const collision = checkCollsion(timeSimulated, objectSimulators);

            if (collision) {
                timeSimulated = collision.time;

                objectSimulators.forEach(simulator => {
                    simulator.restoreState();

                    simulator.simulate(method, timeSimulated, objectSimulators);

                    simulator.respondToCollision(collision);
                });
            }

            // if (timeSimulated < timeRemaining) {
            //     objectSimulators.forEach(simulator => {
            //         simulator.simulate(method, timeRemaining, objectSimulators);
            //     });
            // }

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

    loadObj('obj/box.obj', [1, 7, 3], [0, 0, -0.05], obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        const mesh = new THREE.Mesh(obj.geometry, new THREE.MeshBasicMaterial({
            color: 'blue',
            wireframe: true,
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });
});

const planeGeometry = new THREE.PlaneGeometry(10, 10);

const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({
    color: 'blue',
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
}));
plane.rotation.x = -Math.PI / 2;

scene.add(plane);

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
