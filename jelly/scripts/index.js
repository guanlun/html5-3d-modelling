const Constants = require('./Constants');
const Simulator = require('./Simulator');
const VecMath = require('./VecMath');
const scene = new THREE.Scene();

const WIDTH = 1000;
const HEIGHT = 600;

const props = {
    stepsPerFrame: 1,

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

const objectSimulators = [];

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
                simulator.addVertex({
                    x: parseFloat(segs[1]) + initPos.x,
                    y: parseFloat(segs[2]) + initPos.y,
                    z: parseFloat(segs[3]) + initPos.z,
                }, initVel);
            } else if (dataType === 'vn') {
                // simulator.addNormal({
                //
                // });
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
        simulator.createGeometry();

        callback(simulator);
    });
}

loadObj('obj/box.obj', {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, obj => {
    objectSimulators.push(obj);

    const mesh = new THREE.Mesh(obj.geometry, new THREE.MeshBasicMaterial({
        color: 'red',
        // wireframe: true,
    }));

    scene.add(mesh);
});

loadObj('obj/box_r.obj', {x: 8, y: 5, z: 0}, {x: -0.3, y: 0, z: 0}, obj => {
    objectSimulators.push(obj);

    const mesh = new THREE.Mesh(obj.geometry, new THREE.MeshBasicMaterial({
        color: 0x6666FF,
        wireframe: true,
    }));

    scene.add(mesh);
});

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 0, 30);
    scene.add(directionalLight);

    props.pointLight = new THREE.PointLight(0x7777ff, 0, 500);
    props.pointLight.position.set(0, 0, 0.1);
    scene.add(props.pointLight);
}

initCamera();
initLight();

function pointInTriangle(px, py, pz, vertices) {
    const p1 = vertices[0];
    const p2 = vertices[1];
    const p3 = vertices[2];

    // console.log(p1);

    const a = ((p2.z - p3.z) * (px - p3.x) + (p3.x - p2.x) * (pz - p3.z)) / ((p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z));
    const b = ((p3.z - p1.z) * (px - p3.x) + (p1.x - p3.x) * (pz - p3.z)) / ((p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z));
    const c = 1 - a - b;

    return (a > 0) && (b > 0) && (c > 0);
}

let simulating = true;

function checkVertexFaceCollision(timestep, obj1, obj2) {
    for (let vi = 0; vi < obj1.vertices.length; vi++) {
        const vertex = obj1.vertices[vi];
        const vertexLastState = obj1.lastState[vi];

        for (let fi = 0; fi < obj2.faces.length; fi++) {
            const face = obj2.faces[fi];

            const faceV1 = obj2.vertices[face.vertices[0]].pos;
            const faceV2 = obj2.vertices[face.vertices[1]].pos;
            const faceV3 = obj2.vertices[face.vertices[2]].pos;

            const face12 = VecMath.sub(faceV2, faceV1);
            const face13 = VecMath.sub(faceV3, faceV1);

            const faceNormal = VecMath.normalize(VecMath.cross(face12, face13));

            const lastPosDot = VecMath.dot(faceNormal, VecMath.sub(vertexLastState.pos, faceV1));
            const currPosDot = VecMath.dot(faceNormal, VecMath.sub(vertex.pos, faceV1));

            if (lastPosDot * currPosDot < 0) {
                const candidateCollisionTimeFraction = lastPosDot / (lastPosDot - currPosDot);

                const collisionPos = VecMath.add(vertexLastState.pos, VecMath.scalarMult(timestep * candidateCollisionTimeFraction, vertex.vel));

                if (pointInTriangle(collisionPos.x, collisionPos.y, collisionPos.z, [faceV1, faceV2, faceV3])) {
                    console.log(vertexLastState.pos, vertex.pos);
                    console.log([faceV1, faceV2, faceV3]);
                    console.log(faceNormal);
                    simulating = false;
                }
            }
        }
    }
}

function simulate() {
    if (simulating) {
        const timestep = 0.1;

        objectSimulators.forEach(simulator => {
            simulator.simulate(timestep, objectSimulators);
        });

        if (objectSimulators.length === 2) {
            const obj1 = objectSimulators[0];
            const obj2 = objectSimulators[1];

            checkVertexFaceCollision(timestep, obj2, obj1);
        }
    }

    renderer.render(scene, props.camera);

    requestAnimationFrame(simulate);
}
simulate();
