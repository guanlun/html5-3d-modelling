const Force = require('./Force');
const Gravity = require('./Gravity');
const AirFriction = require('./AirFriction');
const Simulator = require('./Simulator');
const SceneObject = require('./SceneObject');
const StaticPlane = require('./StaticPlane');

const UIControls = require('./UIControls');

class SphereObject extends SceneObject {
    constructor(pos, color) {
        super(pos);

        this.name = `${color} ball`;

        const colorMap = {
            red: 0xff0000,
            green: 0x00ff00,
            blue: 0x0000ff,
        }

        const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: colorMap[color],
            specular: 0x009900,
            shininess: 10,
        });

        this._graphicsObject = new THREE.Mesh(ballGeometry, ballMaterial);

        const mousePickMaterial = new THREE.MeshBasicMaterial({
            color: colorMap[color]
        });

        this._mousePickObject = new THREE.Mesh(ballGeometry, mousePickMaterial);
    }
}

const scene = new THREE.Scene();
const mousePickScene = new THREE.Scene();
const sceneObjects = [];

let camera;

const simulator = new Simulator();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(768, 500);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

const mousePickRenderer = new THREE.WebGLRenderer();
mousePickRenderer.setSize(768, 500);
mousePickRenderer.setClearColor(0x00f000, 1);
document.body.appendChild(mousePickRenderer.domElement);

const mousePickContext = mousePickRenderer.domElement.getContext('webgl');

let dragging = false;
let lastMousePos = null;

const cameraPos = {
    x: 9,
    y: 12,
    z: 15,
};

renderer.domElement.onwheel = (evt) => {
    evt.preventDefault(0);
    const multiplier = 1 + evt.deltaY * 0.001;

    cameraPos.x *= multiplier;
    cameraPos.z *= multiplier;
    cameraPos.y *= multiplier;

    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

renderer.domElement.onmousedown = (evt) => {
    dragging = true;

    lastMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };

    // const data = new Uint8Array(16);
    // mousePickContext.readPixels(evt.offsetX, evt.offsetY, 2, 2, mousePickContext.RGBA, mousePickContext.UNSIGNED_BYTE, data);
}

renderer.domElement.onmousemove = (evt) => {
    if (!dragging) {
        return;
    }

    const currMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };

    const mousePosDiff = {
        x: currMousePos.x - lastMousePos.x,
        y: currMousePos.y - lastMousePos.y,
    };

    const distXZ = Math.sqrt(cameraPos.x * cameraPos.x + cameraPos.z * cameraPos.z);
    const dist = Math.sqrt(distXZ * distXZ + cameraPos.y * cameraPos.y);

    const currXZAngle = Math.atan2(cameraPos.z, cameraPos.x);
    const newXZAngle = currXZAngle + mousePosDiff.x / 57.3;
    const currYAngle = Math.atan2(cameraPos.y, distXZ);
    const newYAngle = currYAngle + mousePosDiff.y / 57.3;

    cameraPos.x = dist * Math.cos(newYAngle) * Math.cos(newXZAngle);
    cameraPos.z = dist * Math.cos(newYAngle) * Math.sin(newXZAngle);
    cameraPos.y = dist * Math.sin(newYAngle);

    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    lastMousePos = currMousePos;
}

renderer.domElement.onmouseup = (evt) => {
    dragging = false;
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        768 / 500,
        0.1,
        1000
    );

    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function initObjects() {
    const ball1 = new SphereObject(new THREE.Vector3(0, 0, 0), 'red');
    ball1.addForce(new Gravity());
    simulator.addObject(ball1);

    scene.add(ball1.getGraphicsObject());
    mousePickScene.add(ball1.getMousePickObject());
    sceneObjects.push(ball1);

    const ball2 = new SphereObject(new THREE.Vector3(-3, 3, 0), 'green');
    ball2.setInitialVelocity(new THREE.Vector3(2, 0, 0));
    ball2.addForce(new Gravity());
    simulator.addObject(ball2);

    scene.add(ball2.getGraphicsObject());
    mousePickScene.add(ball2.getMousePickObject());
    sceneObjects.push(ball2);

    const ball3 = new SphereObject(new THREE.Vector3(-1, -3, -1), 'blue');
    ball3.setInitialVelocity(new THREE.Vector3(3, 0, 3.01));
    ball3.addForce(new Gravity());
    simulator.addObject(ball3);

    scene.add(ball3.getGraphicsObject());
    mousePickScene.add(ball3.getMousePickObject());
    sceneObjects.push(ball3);

    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 1, 0)));
    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0)));
    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(-5, 0, 0), new THREE.Vector3(1, 0, 0)));
    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(5, 0, 0), new THREE.Vector3(-1, 0, 0)));
    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, -5), new THREE.Vector3(0, 0, 1)));
    simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1)));

    const planeMaterial = new THREE.MeshPhongMaterial({
        color: 0x6666ff,
        specular: 0x000099,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
    });

    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const plane1 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane1.position.set(0, 0, 5);
    scene.add(plane1);

    const plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.position.set(0, 0, -5);
    scene.add(plane2);

    const plane3 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane3.position.set(-5, 0, 0);
    plane3.rotation.y = -Math.PI / 2;
    scene.add(plane3);

    const plane4 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane4.position.set(5, 0, 0);
    plane4.rotation.y = -Math.PI / 2;
    scene.add(plane4);

    // Don't render top and bottom
}

function initLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
}

initCamera();
initObjects();
initLight();

let simulationStepSize = 0.01;

const SIM_MULTIPLIER = 0.01;

let stepsPerSample;
computeStepPerSample();
let stepCount = 0;

function simulate() {
    if (stepCount % stepsPerSample === 0) {
        simulator.simulate(simulationStepSize);
    }

    sceneObjects.forEach(so => so.updateGraphics());

    renderer.render(scene, camera);
    // mousePickRenderer.render(mousePickScene, camera);

    stepCount++;
    requestAnimationFrame(simulate);
}
simulate();

function computeStepPerSample() {
    stepsPerSample = Math.floor(simulationStepSize / SIM_MULTIPLIER);
}

const controls = new UIControls();

controls.addListener('step-size-changed', val => {
    simulationStepSize = val;
    computeStepPerSample();
});

controls.addListener('elasticity-changed', val => {
    simulator.elasticity = val;
});

controls.addListener('friction-coeff-changed', val => {
    simulator.frictionCoeff = val;
});
