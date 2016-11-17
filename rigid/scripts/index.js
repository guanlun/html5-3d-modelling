math.normalize = (vec) => {
    var dim = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

    return [vec[0] / dim, vec[1] / dim, vec[2] / dim];
}

math._cross = (vec1, vec2) => {
    return [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];
}

var Simulator = require('./Simulator');
var scene = new THREE.Scene();

var WIDTH = 1000;
var HEIGHT = 600;

var props = {
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

var renderer = new THREE.WebGLRenderer({
    antialias: true,
});

var raycaster = new THREE.Raycaster();
var mouseVec = new THREE.Vector2();

var objectSimulators = [];
var method = 'Euler';
var stepSize = 0.01;

function loadObj(filename, initPos, initRotation, initVel, initAngularVel, callback) {
    var simulator = new Simulator();

    $.get(filename, objData => {
        var jellyObj = {};
        var vertices = [];

        var objLines = objData.split('\n');

        for (var i = 0; i < objLines.length; i++) {
            var line = objLines[i];

            if (line[0] === '#' || line[0] === 'o' || line[0] === 's') {
                continue;
            }

            var segs = line.split(' ');
            var dataType = segs[0];

            if (dataType === 'v') {
                simulator.addVertex([
                    parseFloat(segs[1]),
                    parseFloat(segs[2]),
                    parseFloat(segs[3]),
                ]);
            } else if (dataType === 'f') {
                var face = {
                    vertices: [],
                };

                for (var vI = 1; vI < segs.length; vI++) {
                    var ref = segs[vI];

                    var vSegs = ref.split('/');
                    var vRef = parseInt(vSegs[0]) - 1;
                    var nRef = parseInt(vSegs[2]) - 1;

                    face.vertices.push(vRef);
                }

                simulator.addFace(face);
            }
        }

        simulator.computeCenterOfMass();
        simulator.recenter();
        simulator.computeMomentOfInertia();
        simulator.createGeometry(initPos, initRotation, initVel, initAngularVel);

        callback(simulator);
    });
}

renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

renderer.domElement.onwheel = (evt) => {
    evt.preventDefault(0);
    var multiplier = 1 + evt.deltaY * 0.001;

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

    var currMousePos = {
        x: evt.clientX,
        y: evt.clientY,
    };

    var mousePosDiff = {
        x: currMousePos.x - props.lastMousePos.x,
        y: currMousePos.y - props.lastMousePos.y,
    };

    var distXZ = Math.sqrt(props.cameraPos.x * props.cameraPos.x + props.cameraPos.z * props.cameraPos.z);
    var dist = Math.sqrt(distXZ * distXZ + props.cameraPos.y * props.cameraPos.y);

    var currXZAngle = Math.atan2(props.cameraPos.z, props.cameraPos.x);
    var newXZAngle = currXZAngle + mousePosDiff.x / 57.3;
    var currYAngle = Math.atan2(props.cameraPos.y, distXZ);
    var newYAngle = currYAngle + mousePosDiff.y / 57.3;

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
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 10, -30);
    scene.add(directionalLight);

    props.pointLight = new THREE.PointLight(0xffffff, 1, 1);
    props.pointLight.position.set(0, 0, 10);
    scene.add(props.pointLight);
}

initCamera();
initLight();

var simulating = false;
var basePlaneCollisionOn = false;

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
    var collisions = [];

    for (var i = 0; i < objects.length; i++) {
        var o1 = objects[i];

        var aabb1 = o1.getAABB();

        for (var j = i + 1; j < objects.length; j++) {
            var o2 = objects[j];

            var aabb2 = o2.getAABB();

            if (!aabbOverlap(aabb1, aabb2)) {
                continue;
            }

            var c1 = o1.checkVertexFaceCollision(timestep, o2);
            if (c1) {
                collisions.push(c1);
            }

            var c2 = o2.checkVertexFaceCollision(timestep, o1);
            if (c2) {
                collisions.push(c2);
            }

            var edgeEdgeCol = o1.checkEdgeEdgeCollision(timestep, o2);
            if (edgeEdgeCol) {
                collisions.push(edgeEdgeCol);
            }
        }

        if (basePlaneCollisionOn) {
            var basePlaneCollision = o1.checkBasePlaneCollision(timestep);

            if (basePlaneCollision) {
                collisions.push(basePlaneCollision);
            }
        }
    }

    var earliestCollisionTime = Number.MAX_VALUE;
    var earliestCollision;

    for (var i = 0; i < collisions.length; i++) {
        var col = collisions[i];

        if (col.time < earliestCollisionTime) {
            earliestCollisionTime = col.time;
            earliestCollision = col;
        }
    }

    return earliestCollision;
}

var frame = 0;

function simulate() {
    frame++;
    if (simulating) {
        var timeRemaining = stepSize;
        var collision;

        var iter = 0;

        while (timeRemaining > (0.01 * stepSize) && iter < 10) {
            iter++;

            var timeSimulated = timeRemaining;

            objectSimulators.forEach(simulator => {
                simulator.simulate(method, timeRemaining);
            });

            var collision = checkCollsion(timeSimulated, objectSimulators);

            if (collision) {
                timeSimulated = collision.time;

                objectSimulators.forEach(simulator => {
                    simulator.restoreState();

                    simulator.simulate(method, timeSimulated, objectSimulators);
                });

                if (collision.type === 'static-plane') {
                    var {
                        obj,
                        r_a,
                        normal,
                    } = collision;

                    var inverseI0 = math.inv(obj.momentOfIntertia);
                    var inverseI = math.multiply(math.multiply(obj.state.r, inverseI0), math.transpose(obj.state.r));

                    var w = math.multiply(inverseI, obj.state.l)._data;

                    var v = math.divide(obj.state.p, obj.mass);
                    var pDerivative = math.add(v, math.cross(w, r_a));
                    var v_normal_before = math.dot(pDerivative, normal);

                    var n = -(1 + obj.c_r) * v_normal_before;
                    var d = 1 / obj.mass + math.dot(normal, math.cross(math.multiply(inverseI, math.cross(r_a, normal)), r_a));
                    var j = n / d;

                    var deltaP = math.multiply(1 * j, normal);
                    var deltaL = math.multiply(1, math.cross(r_a, deltaP));

                    obj.state.p = math.multiply(-obj.c_r, obj.state.p)
                    obj.state.l = math.multiply(0.9, math.add(obj.state.l, deltaL));

                } else {
                    var {
                        obj1,
                        obj2,
                        r_a,
                        r_b,
                        normal,
                    } = collision;

                    var inverseIA0 = math.inv(obj1.momentOfIntertia);
                    var inverseIA = math.multiply(math.multiply(obj1.state.r, inverseIA0), math.transpose(obj1.state.r));

                    var inverseIB0 = math.inv(obj2.momentOfIntertia);
                    var inverseIB = math.multiply(math.multiply(obj2.state.r, inverseIB0), math.transpose(obj2.state.r));

                    var wA = math.multiply(inverseIA, obj1.state.l)._data;
                    var vA = math.divide(obj1.state.p, obj1.mass);
                    var pADerivative = math.add(vA, math.cross(wA, r_a));

                    var wB = math.multiply(inverseIB, obj2.state.l)._data;
                    var vB = math.divide(obj2.state.p, obj2.mass);
                    var pBDerivative = math.add(vB, math.cross(wB, r_a));

                    var v_before = math.subtract(pADerivative, pBDerivative);
                    var v_normal_before = math.dot(v_before, normal);

                    var n = -(1 + obj1.c_r) * v_normal_before;
                    var d = 1 / obj1.mass + 1 / obj2.mass +
                            math.dot(normal,
                                math.add(
                                    math.cross(math.multiply(inverseIA, math.cross(r_a, normal)), r_a),
                                    math.cross(math.multiply(inverseIB, math.cross(r_b, normal)), r_b)
                                )
                            );

                    var j = n / d;

                    var deltaP1 = math.multiply(1 * j, normal);
                    var deltaL1 = math.multiply(1 * j, math.cross(r_a, normal));
                    var deltaP2 = math.multiply(-1 * j, normal);
                    var deltaL2 = math.multiply(-1 * j, math.cross(r_b, normal))

                    var coeff = 2;

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

var meshes = [];

var startPauseBtn = $('#start-pause-btn');
startPauseBtn.click(e => {
    simulating = !simulating;
});

var loadPreset1Btn = $('#load-preset-1-btn');
loadPreset1Btn.click(e => {
    objectSimulators = [];
    meshes.forEach(m => {
        scene.remove(m);
    });

    loadObj('obj/hammer.obj',
        [0, 7, 2],
        [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
        [0, 0, -1.0],
        [2, 2, -3],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        var mesh = new THREE.Mesh(obj.geometry, new THREE.MeshPhongMaterial({
            color: 'red',
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });
});

var loadPreset2Btn = $('#load-preset-2-btn');
loadPreset2Btn.click(e => {
    objectSimulators = [];
    meshes.forEach(m => {
        scene.remove(m);
    });

    coeff = 1;

    loadObj('obj/box.obj',
        [0, 7, 2],
        [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
        [0, 0, -1.0],
        [
            -0.4,
            0.2,
            0.1,
        ],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        var mesh = new THREE.Mesh(obj.geometry, new THREE.MeshPhongMaterial({
            color: 'red',
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
        [
            0,
            -0.3,
            0.2,
        ],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        var mesh = new THREE.Mesh(obj.geometry, new THREE.MeshPhongMaterial({
            color: 'blue',
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });
});

var loadPreset3Btn = $('#load-preset-3-btn');
loadPreset3Btn.click(e => {
    objectSimulators = [];
    meshes.forEach(m => {
        scene.remove(m);
    });

    coeff = 1;

    loadObj('obj/hammer.obj',
        [0, 7, 2],
        [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
        [0, 0, -1.0],
        [
            0.1,
            -0.3,
            0.5,
        ],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        var mesh = new THREE.Mesh(obj.geometry, new THREE.MeshPhongMaterial({
            color: 'red',
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
        [
            -0.1,
            0.4,
            -0.3,
        ],
        obj => {
        objectSimulators.push(obj);
        obj.geometry.computeFaceNormals();

        var mesh = new THREE.Mesh(obj.geometry, new THREE.MeshPhongMaterial({
            color: 'blue',
        }));

        scene.add(mesh);
        meshes.push(mesh);
    });
});

var basePlaneCheckbox = $('#base-plane-checkbox');
basePlaneCheckbox.change(e => {
    basePlaneCollisionOn = basePlaneCheckbox.is(':checked');

    if (basePlaneCollisionOn) {
        scene.add(plane);
    } else {
        scene.remove(plane);
    }
});

var methodSelect = $('#method-select');
methodSelect.change(e => {
    method = methodSelect.val();
});

var planeGeometry = new THREE.PlaneGeometry(30, 30);

var plane = new THREE.Mesh(planeGeometry, new THREE.MeshPhongMaterial({
    color: '#cccccc',
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
}));
plane.rotation.x = -Math.PI / 2;

// scene.add(plane);
