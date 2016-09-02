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

class Gravity extends Force {
    constructor() {
        super();

        this._value = new THREE.Vector3(0, -10, 0);
    }

    apply(collider) {
        collider.getAcceleration().add(this._value);
    }
}

class AirFriction extends Force {
    constructor() {
        super();

        this._frictionCoefficient = 1;
    }

    apply(collider) {
        const v = collider.getVelocity();
        const m = collider.getMass();

        const force = new THREE.Vector3(
            -v.x * this._frictionCoefficient / m,
            -v.y * this._frictionCoefficient / m,
            -v.z * this._frictionCoefficient / m
        );

        collider.getAcceleration().add(force);
    }
}

class Collider {
    constructor() {
        this._mass = 10;

        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        this._lastVelocity = new THREE.Vector3(0, 0, 0);
        this._lastPosition = new THREE.Vector3(0, 0, 0);

        this._forces = [];
    }

    getMass() {
        return this._mass;
    }

    getPosition() {
        return this._position;
    }

    getVelocity() {
        return this._velocity;
    }

    getAcceleration() {
        return this._acceleration;
    }

    _restore() {
        this._position.set(this._lastPosition.x, this._lastPosition.y, this._lastPosition.z);
        this._velocity.set(this._lastVelocity.x, this._lastVelocity.y, this._lastVelocity.z);
    }

    _updateLastState() {
        this._lastPosition.set(this._position.x, this._position.y, this._position.z);
        this._lastVelocity.set(this._velocity.x, this._velocity.y, this._velocity.z);
    }

    simulate(deltaT) {
        const PLANE_Y = -5;

        let timeRemaining = deltaT;
        let timeSimulated = deltaT;

        while (timeRemaining > 0) {
            this._calculateAcceleration();
            this._updateState(timeRemaining);

            if (this._collisionOccurred()) {
                const d0 = this._lastPosition.y - PLANE_Y;
                const d1 = this._lastPosition.y - this._position.y;

                timeSimulated = (d0 / d1) * deltaT;

                this._restore();

                this._updateState(timeSimulated);

                this._respondToCollision();
            }

            timeRemaining -= timeSimulated;
        }

        this._updateLastState();
    }

    _calculateAcceleration() {
        this._acceleration.set(0, 0, 0);

        this._forces.forEach(f => f.apply(this));
    }

    _updateState(deltaT) {
        const a = this._acceleration;
        this._velocity.add(new THREE.Vector3(a.x * deltaT, a.y * deltaT, a.z * deltaT));

        const v = this._velocity;
        this._position.add(new THREE.Vector3(v.x * deltaT, v.y * deltaT, v.z * deltaT));
    }

    _collisionOccurred() {
        const PLANE_Y = -5;
        return (this._lastPosition.y > PLANE_Y && this._position.y < PLANE_Y);
    }

    _respondToCollision() {
        this._velocity.y = -0.8 * this._velocity.y;
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
    const ball = new SphereObject();
    const ballCollider = new SphereCollider();
    ballCollider.addForce(new Gravity());
    // ballCollider.addForce(new AirFriction());
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
    sceneObjects.forEach(so => so.simulate(0.01));

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();
