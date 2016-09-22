const Force = require('./Force');
const Gravity = require('./Gravity');
const AirFriction = require('./AirFriction');
const Simulator = require('./Simulator');
const StaticPlane = require('./StaticPlane');
const SphereObject = require('./SphereObject');
const UIControls = require('./UIControls');

const scene = new THREE.Scene();

const props = {
    stepsPerFrame: 1,

    camera: null,
    cameraPos: {
        x: 9,
        y: 12,
        z: 15,
    },

    gravity: null,
    airFriction: null,

    planes: [],
    cone: null,

    ball1: null,
    ball2: null,
    ball3: null,

    dragging: false,
    lastMousePos: null,
}

const simulator = new Simulator();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(720, 500);
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
        720 / 500,
        0.1,
        1000
    );

    props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
    props.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function initContainer(shape) {
    simulator.clearStaticPlanes();

    const containerMaterial = new THREE.MeshPhongMaterial({
        color: 0x6666ff,
        specular: 0x000099,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
    });

    if (shape === 'box') {
        scene.remove(props.cone);

        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 1, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(-10, 0, 0), new THREE.Vector3(1, 0, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(10, 0, 0), new THREE.Vector3(-1, 0, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, -10), new THREE.Vector3(0, 0, 1)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1)));

        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const plane1 = new THREE.Mesh(planeGeometry, containerMaterial);
        plane1.position.set(0, 0, 10);
        scene.add(plane1);

        const plane2 = new THREE.Mesh(planeGeometry, containerMaterial);
        plane2.position.set(0, 0, -10);
        scene.add(plane2);

        const plane3 = new THREE.Mesh(planeGeometry, containerMaterial);
        plane3.position.set(-10, 0, 0);
        plane3.rotation.y = -Math.PI / 2;
        scene.add(plane3);

        const plane4 = new THREE.Mesh(planeGeometry, containerMaterial);
        plane4.position.set(10, 0, 0);
        plane4.rotation.y = -Math.PI / 2;
        scene.add(plane4);

        props.planes = [plane1, plane2, plane3, plane4];

    } else if (shape === 'pyramid') {
        props.planes.forEach(p => scene.remove(p));

        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 1, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(-10, -10, 0), new THREE.Vector3(0.866, -0.5, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(10, -10, 0), new THREE.Vector3(-0.866, -0.5, 0)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, -10), new THREE.Vector3(0, -0.5, 0.866)));
        simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 10), new THREE.Vector3(0, -0.5, -0.866)));

        const coneGeometry = new THREE.ConeGeometry(
            7.07 * 2, 10 * 2, 4
        );

        props.cone = new THREE.Mesh(coneGeometry, containerMaterial);
        props.cone.position.set(0, 0, 0);
        props.cone.rotation.y = -Math.PI / 4;
        scene.add(props.cone);
    }
}

function initForces() {
    props.gravity = new Gravity();
    props.airFriction = new AirFriction();
}

function initObjects() {
    simulator.addForce(props.gravity);
    simulator.addForce(props.airFriction);

    props.ball1 = new SphereObject(new THREE.Vector3(0, 0, 0), 'red');
    simulator.addObject(props.ball1);

    scene.add(props.ball1.getGraphicsObject());

    props.ball2 = new SphereObject(new THREE.Vector3(-3, -2, 0), 'green');
    props.ball2.setInitialVelocity(new THREE.Vector3(2, 0, 0));
    simulator.addObject(props.ball2);

    scene.add(props.ball2.getGraphicsObject());

    props.ball3 = new SphereObject(new THREE.Vector3(-1, -3, -1), 'blue');
    props.ball3.setInitialVelocity(new THREE.Vector3(3, 0, 3.01));
    simulator.addObject(props.ball3);

    scene.add(props.ball3.getGraphicsObject());
}

function initLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 30, 30);
    scene.add(directionalLight);
}

function initControls() {
    const controls = new UIControls();

    controls.addListener('reset-button-clicked', throwIntoTheAir);

    controls.addListener('container-shape-changed', (shape) => {
        initContainer(shape);
    });

    controls.addListener('step-size-changed', val => {
        props.stepsPerFrame = val;
    });

    controls.addListener('elasticity-changed', val => {
        simulator.elasticity = val;
    });

    controls.addListener('friction-coeff-changed', val => {
        simulator.frictionCoeff = val;
    });

    controls.addListener('air-friction-changed', val => {
        props.airFriction.setCoefficient(val);
    });
}

function throwIntoTheAir() {
    props.ball1.vel.set(1.3, 10.01, 0);
    props.ball2.vel.set(0, 12.01, 4.01);
    props.ball3.vel.set(1.01, 13, Math.random() * 5);
}

initCamera();
initForces();
initObjects();
initContainer('box');
initLight();
initControls();

function simulate() {
    for (let i = 0; i < props.stepsPerFrame; i++) {
        simulator.simulate(0.01 / props.stepsPerFrame);
    }

    simulator.refreshDispaly();

    renderer.render(scene, props.camera);

    requestAnimationFrame(simulate);
}
simulate();
