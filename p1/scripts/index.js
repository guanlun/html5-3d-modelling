const Force = require('./Force');
const Gravity = require('./Gravity');
const AirFriction = require('./AirFriction');
const Collider = require('./Collider');
const Simulator = require('./Simulator');
const SceneObject = require('./SceneObject');
const StaticPlane = require('./StaticPlane');

const UIControls = require('./UIControls');

class SphereObject extends SceneObject {
    constructor(pos) {
        super(pos);

        const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            specular: 0x009900,
            shininess: 10,
        });

        this._graphicsObject = new THREE.Mesh(ballGeometry, ballMaterial);
    }
}

const scene = new THREE.Scene();
const sceneObjects = [];

let camera;

const simulator = new Simulator();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(800, 500);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

let dragging = false;
let lastMousePos = null;

const cameraPos = {
    x: 9,
    y: 12,
    z: 15,
};

renderer.domElement.onmousedown = (evt) => {
    dragging = true;

    lastMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };
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
        800 / 500,
        0.1,
        1000
    );

    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function initObjects() {
    // const ball = new SphereObject();
    // ball.addForce(new Gravity());
    // simulator.addObject(ball);
    //
    // scene.add(ball.getGraphicsObject());
    // sceneObjects.push(ball);
    //
    // const ball2 = new SphereObject(new THREE.Vector3(-3, 3, 0));
    // ball2.setInitialVelocity(new THREE.Vector3(3, 0, 0));
    // ball2.addForce(new Gravity());
    // simulator.addObject(ball2);
    //
    // scene.add(ball2.getGraphicsObject());
    // sceneObjects.push(ball2);

    const ball3 = new SphereObject(new THREE.Vector3(-4, 4, -4));
    ball3.setInitialVelocity(new THREE.Vector3(3, 0, 3));
    ball3.addForce(new Gravity());
    simulator.addObject(ball3);

    scene.add(ball3.getGraphicsObject());
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

function render() {
    simulator.simulate(0.01);

    sceneObjects.forEach(so => so.updateGraphics());

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();

const controls = new UIControls();

controls.addListener('step-size-changed', event => {
    console.log(event, 'hahahahahahahahahahahahaha');
});
