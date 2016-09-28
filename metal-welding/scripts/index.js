const Constants = require('./Constants');
const Simulator = require('./Simulator');
const scene = new THREE.Scene();

const WIDTH = 1000;
const HEIGHT = 600;

const props = {
    stepsPerFrame: 1,

    camera: null,
    cameraPos: {
        x: 0,
        y: 0,
        z: 20,
    },

    dragging: false,
    lastMousePos: null,

    pointLight: null,

    welder: null,
}

const simulator = new Simulator();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const objLoader = new THREE.OBJLoader();

objLoader.load('obj/welder.obj', obj => {
    obj.traverse(child => {
        if (child.type === 'Mesh') {
            const welder = child;

            welder.material = new THREE.MeshPhongMaterial({
                color: 0x333333,
            });
            scene.add(welder);

            const welderGeometry = new THREE.Geometry().fromBufferGeometry(welder.geometry);
            welderGeometry.faces.forEach(f => {
                const v1 = welderGeometry.vertices[f.a];
                const v2 = welderGeometry.vertices[f.b];
                const v3 = welderGeometry.vertices[f.c];

                simulator.addTriangle([v1, v2, v3], f.normal);
            });

            props.welder = welder;
        }
    });
})

renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0x000000, 1);
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

function handleMousePos(evt) {
    mouseVec.x = (event.clientX / WIDTH) * 2 - 1;
    mouseVec.y = -(event.clientY / HEIGHT) * 2 + 1;

    raycaster.setFromCamera(mouseVec, props.camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const p = intersects[0].point;

        const x = p.x;
        const y = p.y;
        const z = 0.1;

        simulator.startPos = {
            x: x,
            y: y,
            z: z,
        };

        props.pointLight.position.set(x, y, z);
        props.welder.position.set(x, y, z);
        simulator.setWelderPosition(x, y, z);
    }
}

renderer.domElement.onmousedown = (evt) => {
    props.dragging = true;

    props.pointLight.intensity = 50;

    handleMousePos(evt);

    simulator.generateParticles = true;
}

renderer.domElement.onmousemove = (evt) => {
    if (!props.dragging) {
        return;
    }

    handleMousePos(evt);
}

renderer.domElement.onmouseup = (evt) => {
    props.dragging = false;

    props.pointLight.intensity = 0;

    simulator.generateParticles = false;
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

function initContainer() {
    const texture = textureLoader.load('img/metal.jpg');
    const specTexture = textureLoader.load('img/metal_SPEC.jpg');

    const containerMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        transparent: false,
        map: texture,
        specularMap:  specTexture,
    });

    scene.remove(props.cone);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const plane1 = new THREE.Mesh(planeGeometry, containerMaterial);
    scene.add(plane1);
}

function initObjects() {
    const particles = new THREE.BufferGeometry();

    const positions = new Float32Array(Constants.SMOKE.PARTICLE_NUM * 3);
    const velocities = new Float32Array(Constants.SMOKE.PARTICLE_NUM * 3);
    const ages = new Float32Array(Constants.SMOKE.PARTICLE_NUM);
    const states = new Float32Array(Constants.SMOKE.PARTICLE_NUM);

    for (let i = 0; i < Constants.SMOKE.PARTICLE_NUM; i++) {
        states[i] = 0.0;
        ages[i] = 0.0;
    }

    particles.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.addAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particles.addAttribute('age', new THREE.BufferAttribute(ages, 1));
    particles.addAttribute('state', new THREE.BufferAttribute(states, 1));

    simulator.setParticles(particles);

    const particleShader = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        blending: THREE.AdditiveBlending,
        transparent: true,
    });

    const particleSystem = new THREE.LineSegments(particles, particleShader);
    scene.add(particleSystem);

    const smokeParticles = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(Constants.SMOKE.PARTICLE_NUM * 3);
    const smokeVelocities = new Float32Array(Constants.SMOKE.PARTICLE_NUM * 3);
    const smokeAges = new Float32Array(Constants.SMOKE.PARTICLE_NUM);
    const smokeStates = new Float32Array(Constants.SMOKE.PARTICLE_NUM);

    for (let i = 0; i < Constants.SMOKE.PARTICLE_NUM; i++) {
        smokeStates[i] = 0.0;
        smokeAges[i] = 0.0;
    }

    smokeParticles.addAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeParticles.addAttribute('velocity', new THREE.BufferAttribute(smokeVelocities, 3));
    smokeParticles.addAttribute('age', new THREE.BufferAttribute(smokeAges, 1));
    smokeParticles.addAttribute('state', new THREE.BufferAttribute(smokeStates, 1));

    simulator.setSmokeParticles(smokeParticles);

    const texture = textureLoader.load('img/smoke-sprite.png');

    const smokeShader = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('smokeVertexShader').textContent,
        fragmentShader: document.getElementById('smokeFragmentShader').textContent,
        blending: THREE.AdditiveBlending,
        transparent: true,
        uniforms: {
            texture1: {
                type: 't',
                value: texture,
            }
        }
    });

    const smokeParticleSystem = new THREE.Points(smokeParticles, smokeShader);
    scene.add(smokeParticleSystem);
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
initContainer();
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
