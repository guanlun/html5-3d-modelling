class Force {
    constructor() {
        this._value = null;
    }

    getValue() {
        return this._value;
    }

    apply(collider) {
        throw new Error('function `apply` is not implemented');
    }
}

class GravitationalForce extends Force {
    constructor() {
        super();

        this._value = new THREE.Vector3(0, -10, 0);
    }

    apply(collider) {
        collider.getAcceleration().add(this._value);
    }
}

class Collider {
    constructor() {
        this._mass = 1;

        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        this._forces = [];
    }

    getPosition() {
        return this._position;
    }

    getAcceleration() {
        return this._acceleration;
    }

    simulate(deltaT) {
        this._calculateAcceleration();
        this._updateState(deltaT);
    }

    _calculateAcceleration() {
        this._acceleration.set(0, 0, 0);

        this._forces.forEach(f => f.apply(this));
    }

    _updateState(deltaT) {
        this._velocity.add(this._acceleration.multiplyScalar(deltaT));
        this._position.add(this._velocity.multiplyScalar(deltaT));
    }

    addForce(force) {
        this._forces.push(force);
    }
}

class SphereCollider extends Collider {
    constructor() {
        super();
    }
}

class SceneObject {
    constructor(pos) {
        this._pos = pos;

        this._graphicsObject = null;
        this._collider = null;
    }

    simulate(deltaT) {
        this._collider.simulate(deltaT);

        const pos = this._collider.getPosition();

        this._graphicsObject.position.set(pos.x, pos.y, pos.z);
    }

    getGraphicsObject() {
        return this._graphicsObject;
    }

    setCollider(collider) {
        this._collider = collider;
    }

    getCollider() {
        return this._collider;
    }
}

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

const renderer = new THREE.WebGLRenderer();
renderer.setSize(800, 500);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

function initCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        800 / 500,
        0.1,
        1000
    );

    camera.position.set(10, 10, 12);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function initObjects() {
    const ball = new SphereObject();
    const ballCollider = new SphereCollider();
    ballCollider.addForce(new GravitationalForce());
    ball.setCollider(ballCollider);

    scene.add(ball.getGraphicsObject());

    sceneObjects.push(ball);

    const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
    const boxMaterial = new THREE.MeshPhongMaterial({
        color: 0x6666ff,
        specular: 0x000099,
        shininess: 10,
        transparent: true,
        opacity: 0.6,
        shading: THREE.FlatShading,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(box);
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
    sceneObjects.forEach(so => so.simulate(0.1));

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();
