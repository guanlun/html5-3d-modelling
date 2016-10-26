const Constants = require('./Constants');
const Simulator = require('./Simulator');
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

const simulator = new Simulator();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const objLoader = new THREE.OBJLoader();

// objLoader.load('obj/box.obj', obj => {
//     obj.traverse(child => {
//         if (child.type === 'Mesh') {
//             const jelly = child;
//
//             simulator.setGeometry(jelly);
//
//             const mesh = new THREE.Mesh(simulator.geometry, new THREE.MeshBasicMaterial({
//                 color: 0x6666FF,
//                 wireframe: true,
//             }));
//
//             scene.add(mesh);
//
//             props.jelly = mesh;
//         }
//     });
// });

$.get('obj/jelly_tri.obj', objData => {
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
                x: parseFloat(segs[1]),
                y: parseFloat(segs[2]),
                z: parseFloat(segs[3]),
            });
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
                // console.log(vRef);
            }

            simulator.addFace(face);
        }
    }
    simulator.createGeometry();

    const mesh = new THREE.Mesh(simulator.geometry, new THREE.MeshBasicMaterial({
        color: 0x6666FF,
        wireframe: true,
    }));

    scene.add(mesh);

    props.jelly = mesh;
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

function initObjects() {

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
initObjects();
initLight();

function simulate() {
    for (let i = 0; i < props.stepsPerFrame; i++) {
        simulator.simulate(0.01 / props.stepsPerFrame);
    }

    if (props.pointLight.intensity !== 0) {
        props.pointLight.intensity = Math.random() * 160 + 60;
    }

    renderer.render(scene, props.camera);

    requestAnimationFrame(simulate);
}
simulate();
