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
let stepSize = 0.01;

function loadObj(filename, initPos, initRotation, initVel, callback) {
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
        simulator.createGeometry(initPos, initRotation, initVel);

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

let simulating = false;

function aabbOverlap(aabb1, aabb2) {
    if (aabb1.maxX < aabb2.minX) {
        return false;
    }

    if (aabb1.minX > aabb2.maxX) {
        return false;
    }

    if (aabb1.maxY < aabb2.minY) {
        return false;
    }

    if (aabb1.minY > aabb2.maxY) {
        return false;
    }

    if (aabb1.maxZ < aabb2.minZ) {
        return false;
    }

    if (aabb1.minZ > aabb2.maxZ) {
        return false;
    }

    return true;
}

function checkCollsion(timestep, objects) {
    let collisions = [];

    for (let i = 0; i < objects.length; i++) {
        const o1 = objects[i];

        const aabb1 = o1.getAABB();

        for (let j = i + 1; j < objects.length; j++) {
            const o2 = objects[j];

            const aabb2 = o2.getAABB();

            if (!aabbOverlap(aabb1, aabb2)) {
                continue;
            }

            const c1 = o1.checkVertexFaceCollision(timestep, o2);
            if (c1) {
                collisions.push(c1);
            }

            const c2 = o2.checkVertexFaceCollision(timestep, o1);
            if (c2) {
                collisions.push(c2);
            }

            const edgeEdge = o1.checkEdgeEdgeCollision(timestep, o2);
            if (edgeEdge) {
                collisions.push(edgeEdge);
            }
        }

        const basePlaneCollision = o1.checkBasePlaneCollision(timestep);

        if (basePlaneCollision) {
            collisions.push(basePlaneCollision);
        }
    }

    let earliestCollisionTime = Number.MAX_VALUE;
    let earliestCollision;

    for (let i = 0; i < collisions.length; i++) {
        const col = collisions[i];

        if (col.time < earliestCollisionTime) {
            earliestCollisionTime = col.time;
            earliestCollision = col;
        }
    }

    return earliestCollision;
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
                // simulating = false;
                console.log(collision);

                timeSimulated = collision.time;

                objectSimulators.forEach(simulator => {
                    simulator.restoreState();

                    simulator.simulate(method, timeSimulated, objectSimulators);
                });

                if (collision.type === 'static-plane') {
                    const {
                        obj,
                        r_a,
                        normal,
                    } = collision;

                    // TODO: optimize
                    const inverseI0 = math.inv(obj.momentOfIntertia);
                    const inverseI = math.multiply(math.multiply(obj.state.r, inverseI0), math.transpose(obj.state.r));

                    const w = math.multiply(inverseI, obj.state.l)._data;

                    const v = math.divide(obj.state.p, obj.mass);
                    const pDerivative = math.add(v, math.cross(w, r_a));
                    // console.log(frame, stepSize, obj.state.p, w, r_a, pDerivative);

                    // const v_before = math.divide(obj.state.p, obj.mass);
                    const v_normal_before = math.dot(pDerivative, normal);

                    const n = -(1 + obj.c_r) * v_normal_before;
                    const d = 1 / obj.mass + math.dot(normal, math.cross(math.multiply(inverseI, math.cross(r_a, normal)), r_a));
                    const j = n / d;

                    const deltaP = math.multiply(1 * j, normal);
                    const deltaL = math.multiply(1, math.cross(r_a, deltaP));

                    obj.state.p = math.multiply(-obj.c_r, obj.state.p)
                    obj.state.l = math.add(obj.state.l, deltaL);

                } else {
                    const {
                        obj1,
                        obj2,
                        r_a,
                        r_b,
                        normal,
                    } = collision;

                    const v_before = math.subtract(math.divide(obj1.state.p, obj1.mass), math.divide(obj2.state.p, obj2.mass));
                    const v_normal_before = math.dot(v_before, normal);

                    const inverseIA0 = math.inv(obj1.momentOfIntertia);
                    const inverseIA = math.multiply(math.multiply(obj1.state.r, inverseIA0), math.transpose(obj1.state.r));

                    const inverseIB0 = math.inv(obj2.momentOfIntertia);
                    const inverseIB = math.multiply(math.multiply(obj2.state.r, inverseIB0), math.transpose(obj2.state.r));

                    const n = -(1 + obj1.c_r) * v_normal_before;
                    const d = 1 / obj1.mass + 1 / obj2.mass +
                            math.dot(normal,
                                math.add(
                                    math.cross(math.multiply(inverseIA, math.cross(r_a, normal)), r_a),
                                    math.cross(math.multiply(inverseIB, math.cross(r_b, normal)), r_b)
                                )
                            );

                    const j = n / d;

                    const deltaP1 = math.multiply(1 * j, normal);
                    const deltaL1 = math.multiply(1 * j, math.cross(r_a, normal));
                    const deltaP2 = math.multiply(-1 * j, normal);
                    const deltaL2 = math.multiply(-1 * j, math.cross(r_b, normal))

                    const coeff = 3;

                    // console.log(deltaL1, deltaL2);

                    obj1.state.p = math.add(obj1.state.p, math.multiply(coeff, deltaP1));
                    obj1.state.l = math.add(obj1.state.l, math.multiply(coeff, deltaL1));

                    obj2.state.p = math.add(obj2.state.p, math.multiply(coeff, deltaP2));
                    obj2.state.l = math.add(obj2.state.l, math.multiply(coeff, deltaL2));
                }
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

    loadObj('obj/box.obj',
        [0, 7, 2],
        [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
        [0, 0, -1.0],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        const mesh = new THREE.Mesh(obj.geometry, new THREE.MeshBasicMaterial({
            color: 'red',
            wireframe: true,
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });

    loadObj('obj/box.obj',
        [1, 7, -3],
        [
            [0.866, 0.5, 0],
            [-0.5, 0.866, 0],
            [0, 0, 1],
        ],
        [0.01, 0, 0.8],
        obj => {
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

const planeGeometry = new THREE.PlaneGeometry(100, 100);

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
