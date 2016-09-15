"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        function EventEmitter() {
            this._events = this._events || {};
            this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;

        // Backwards-compat with node 0.10.x
        EventEmitter.EventEmitter = EventEmitter;

        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;

        // By default EventEmitters will print a warning if more than 10 listeners are
        // added to it. This is a useful default which helps finding memory leaks.
        EventEmitter.defaultMaxListeners = 10;

        // Obviously not all Emitters should be limited to 10. This function allows
        // that to be increased. Set to zero for unlimited.
        EventEmitter.prototype.setMaxListeners = function (n) {
            if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
            this._maxListeners = n;
            return this;
        };

        EventEmitter.prototype.emit = function (type) {
            var er, handler, len, args, i, listeners;

            if (!this._events) this._events = {};

            // If there is no 'error' event listener then throw.
            if (type === 'error') {
                if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                    er = arguments[1];
                    if (er instanceof Error) {
                        throw er; // Unhandled 'error' event
                    } else {
                        // At least give some kind of context to the user
                        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
                        err.context = er;
                        throw err;
                    }
                }
            }

            handler = this._events[type];

            if (isUndefined(handler)) return false;

            if (isFunction(handler)) {
                switch (arguments.length) {
                    // fast cases
                    case 1:
                        handler.call(this);
                        break;
                    case 2:
                        handler.call(this, arguments[1]);
                        break;
                    case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;
                    // slower
                    default:
                        args = Array.prototype.slice.call(arguments, 1);
                        handler.apply(this, args);
                }
            } else if (isObject(handler)) {
                args = Array.prototype.slice.call(arguments, 1);
                listeners = handler.slice();
                len = listeners.length;
                for (i = 0; i < len; i++) {
                    listeners[i].apply(this, args);
                }
            }

            return true;
        };

        EventEmitter.prototype.addListener = function (type, listener) {
            var m;

            if (!isFunction(listener)) throw TypeError('listener must be a function');

            if (!this._events) this._events = {};

            // To avoid recursion in the case that type === "newListener"! Before
            // adding it to the listeners, first emit "newListener".
            if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);

            if (!this._events[type])
                // Optimize the case of one listener. Don't need the extra array object.
                this._events[type] = listener;else if (isObject(this._events[type]))
                // If we've already got an array, just append.
                this._events[type].push(listener);else
                // Adding the second element, need to change to array.
                this._events[type] = [this._events[type], listener];

            // Check for listener leak
            if (isObject(this._events[type]) && !this._events[type].warned) {
                if (!isUndefined(this._maxListeners)) {
                    m = this._maxListeners;
                } else {
                    m = EventEmitter.defaultMaxListeners;
                }

                if (m && m > 0 && this._events[type].length > m) {
                    this._events[type].warned = true;
                    console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
                    if (typeof console.trace === 'function') {
                        // not supported in IE 10
                        console.trace();
                    }
                }
            }

            return this;
        };

        EventEmitter.prototype.on = EventEmitter.prototype.addListener;

        EventEmitter.prototype.once = function (type, listener) {
            if (!isFunction(listener)) throw TypeError('listener must be a function');

            var fired = false;

            function g() {
                this.removeListener(type, g);

                if (!fired) {
                    fired = true;
                    listener.apply(this, arguments);
                }
            }

            g.listener = listener;
            this.on(type, g);

            return this;
        };

        // emits a 'removeListener' event iff the listener was removed
        EventEmitter.prototype.removeListener = function (type, listener) {
            var list, position, length, i;

            if (!isFunction(listener)) throw TypeError('listener must be a function');

            if (!this._events || !this._events[type]) return this;

            list = this._events[type];
            length = list.length;
            position = -1;

            if (list === listener || isFunction(list.listener) && list.listener === listener) {
                delete this._events[type];
                if (this._events.removeListener) this.emit('removeListener', type, listener);
            } else if (isObject(list)) {
                for (i = length; i-- > 0;) {
                    if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                        position = i;
                        break;
                    }
                }

                if (position < 0) return this;

                if (list.length === 1) {
                    list.length = 0;
                    delete this._events[type];
                } else {
                    list.splice(position, 1);
                }

                if (this._events.removeListener) this.emit('removeListener', type, listener);
            }

            return this;
        };

        EventEmitter.prototype.removeAllListeners = function (type) {
            var key, listeners;

            if (!this._events) return this;

            // not listening for removeListener, no need to emit
            if (!this._events.removeListener) {
                if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
                return this;
            }

            // emit removeListener for all listeners on all events
            if (arguments.length === 0) {
                for (key in this._events) {
                    if (key === 'removeListener') continue;
                    this.removeAllListeners(key);
                }
                this.removeAllListeners('removeListener');
                this._events = {};
                return this;
            }

            listeners = this._events[type];

            if (isFunction(listeners)) {
                this.removeListener(type, listeners);
            } else if (listeners) {
                // LIFO order
                while (listeners.length) {
                    this.removeListener(type, listeners[listeners.length - 1]);
                }
            }
            delete this._events[type];

            return this;
        };

        EventEmitter.prototype.listeners = function (type) {
            var ret;
            if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
            return ret;
        };

        EventEmitter.prototype.listenerCount = function (type) {
            if (this._events) {
                var evlistener = this._events[type];

                if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
            }
            return 0;
        };

        EventEmitter.listenerCount = function (emitter, type) {
            return emitter.listenerCount(type);
        };

        function isFunction(arg) {
            return typeof arg === 'function';
        }

        function isNumber(arg) {
            return typeof arg === 'number';
        }

        function isObject(arg) {
            return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg !== null;
        }

        function isUndefined(arg) {
            return arg === void 0;
        }
    }, {}], 2: [function (require, module, exports) {
        var Force = require('./Force');

        module.exports = function (_Force) {
            _inherits(AirFriction, _Force);

            function AirFriction() {
                _classCallCheck(this, AirFriction);

                var _this = _possibleConstructorReturn(this, _Force.call(this));

                _this._frictionCoefficient = 0.1;
                return _this;
            }

            AirFriction.prototype.apply = function apply(object) {
                var v = object.vel;

                var force = new THREE.Vector3(-v.x * this._frictionCoefficient, -v.y * this._frictionCoefficient, -v.z * this._frictionCoefficient);

                object.acc.add(force);
            };

            AirFriction.prototype.setCoefficient = function setCoefficient(c) {
                this._frictionCoefficient = c;
            };

            return AirFriction;
        }(Force);
    }, { "./Force": 3 }], 3: [function (require, module, exports) {
        module.exports = function () {
            function Force() {
                _classCallCheck(this, Force);

                this._value = null;
            }

            Force.prototype.getValue = function getValue() {
                return this._value;
            };

            Force.prototype.apply = function apply(collider) {
                throw new Error('function `apply` is not implemented');
            };

            return Force;
        }();
    }, {}], 4: [function (require, module, exports) {
        var Force = require('./Force');

        module.exports = function (_Force2) {
            _inherits(Gravity, _Force2);

            function Gravity() {
                _classCallCheck(this, Gravity);

                var _this2 = _possibleConstructorReturn(this, _Force2.call(this));

                _this2._value = new THREE.Vector3(0, -10, 0);
                return _this2;
            }

            Gravity.prototype.apply = function apply(object) {
                object.acc.add(this._value);
            };

            return Gravity;
        }(Force);
    }, { "./Force": 3 }], 5: [function (require, module, exports) {
        module.exports = function () {
            function SceneObject(pos) {
                _classCallCheck(this, SceneObject);

                this._graphicsObject = null;
                this._mousePickObject = null;

                this.radius = 1;

                this.pos = pos || new THREE.Vector3(0, 0, 0);
                this.vel = new THREE.Vector3(0, 0, 0);
                this.acc = new THREE.Vector3(0, 0, 0);

                this._forces = [];

                this.lastState = null;
            }

            SceneObject.prototype.setInitialVelocity = function setInitialVelocity(vel) {
                this.vel = vel;
            };

            SceneObject.prototype.addForce = function addForce(f) {
                this._forces.push(f);
            };

            SceneObject.prototype.getGraphicsObject = function getGraphicsObject() {
                return this._graphicsObject;
            };

            SceneObject.prototype.getMousePickObject = function getMousePickObject() {
                return this._mousePickObject;
            };

            SceneObject.prototype.calculateAcceleration = function calculateAcceleration(forces) {
                var _this3 = this;

                this.acc.set(0, 0, 0);

                forces.forEach(function (f) {
                    return f.apply(_this3);
                });
            };

            SceneObject.prototype.integrate = function integrate(deltaT) {
                this.vel.add(new THREE.Vector3(this.acc.x * deltaT, this.acc.y * deltaT, this.acc.z * deltaT));

                if (this.restingAgainst) {
                    this.vel.y = 0;
                }

                this.pos.add(new THREE.Vector3(this.vel.x * deltaT, this.vel.y * deltaT, this.vel.z * deltaT));
            };

            SceneObject.prototype.respondToCollision = function respondToCollision(collision, elasticity, frictionCoeff) {
                var point = collision.point;
                var normal = collision.normal;


                var normalVel = normal.clone().multiplyScalar(this.vel.dot(normal));
                var tangentialVel = this.vel.clone().sub(normalVel);

                normalVel.multiplyScalar(-elasticity);
                tangentialVel.multiplyScalar(1 - frictionCoeff);

                this.vel.set(normalVel.x + tangentialVel.x, normalVel.y + tangentialVel.y, normalVel.z + tangentialVel.z);
            };

            SceneObject.prototype.updateGraphics = function updateGraphics() {
                this._graphicsObject.position.set(this.pos.x, this.pos.y, this.pos.z);
                this._mousePickObject.position.set(this.pos.x, this.pos.y, this.pos.z);
            };

            SceneObject.prototype.restoreLastState = function restoreLastState() {
                var lastPos = this.lastState.pos;
                var lastVel = this.lastState.vel;
                this.pos.set(lastPos.x, lastPos.y, lastPos.z);
                this.vel.set(lastVel.x, lastVel.y, lastVel.z);
            };

            SceneObject.prototype.updateLastState = function updateLastState() {
                this.lastState = {
                    pos: new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z),
                    vel: new THREE.Vector3(this.vel.x, this.vel.y, this.vel.z)
                };
            };

            return SceneObject;
        }();
    }, {}], 6: [function (require, module, exports) {
        module.exports = function () {
            function Simulator() {
                _classCallCheck(this, Simulator);

                this._objects = [];
                this._staticPlanes = [];
                this._forces = [];

                this.elasticity = 0.5;
                this.frictionCoeff = 0.5;
                this.airFriction = 0.1;
            }

            Simulator.prototype.addObject = function addObject(object) {
                this._objects.push(object);
            };

            Simulator.prototype.getObjects = function getObjects() {
                return this._objects;
            };

            Simulator.prototype.addStaticPlane = function addStaticPlane(so) {
                this._staticPlanes.push(so);
            };

            Simulator.prototype.clearStaticPlanes = function clearStaticPlanes() {
                this._staticPlanes = [];
            };

            Simulator.prototype.simulate = function simulate(deltaT) {
                var _this4 = this;

                var timeRemaining = deltaT;

                this._objects.forEach(function (obj) {
                    obj.calculateAcceleration(_this4._forces);

                    _this4.checkResting(obj);
                });

                var MAX_ITERATION = 20;

                var _loop = function _loop() {
                    var timeSimulated = timeRemaining;
                    _this4._objects.forEach(function (obj) {
                        obj.integrate(timeRemaining);
                    });

                    var collisions = _this4.getCollisions();

                    var earliestCollisionTime = deltaT;
                    var earliestCollision = null;

                    if (collisions.length !== 0) {
                        collisions.forEach(function (col) {
                            var obj = col.object;
                            obj.collisionNormal = col.normal;

                            var collisionTime = col.fraction * deltaT;

                            if (collisionTime < earliestCollisionTime) {
                                // Get the earliest collision in this timestep
                                earliestCollisionTime = collisionTime;
                                earliestCollision = col;
                            }
                        });

                        timeSimulated = earliestCollisionTime;

                        _this4._objects.forEach(function (obj) {
                            obj.restoreLastState();
                            obj.integrate(timeSimulated);

                            if (earliestCollision) {
                                if (obj === earliestCollision.object || obj === earliestCollision.withObject) {
                                    obj.respondToCollision(earliestCollision, _this4.elasticity, _this4.frictionCoeff);
                                }
                            }
                        });
                    }

                    timeRemaining -= timeSimulated;

                    _this4._objects.forEach(function (obj) {
                        obj.updateLastState();
                    });
                };

                while (timeRemaining > 0) {
                    _loop();
                }
            };

            Simulator.prototype.getCollisions = function getCollisions() {
                var collisions = [];

                var numObjs = this._objects.length;

                for (var i = 0; i < numObjs; i++) {
                    var obj = this._objects[i];
                    if (!obj.lastState) {
                        continue;
                    }

                    var staticPlaneCollisions = this._getStaticPlaneCollisions(obj);

                    collisions = collisions.concat(staticPlaneCollisions);

                    for (var j = i + 1; j < numObjs; j++) {
                        var obj2 = this._objects[j];

                        var objDist = obj.pos.distanceTo(obj2.pos);
                        var lastObjDist = obj.lastState.pos.distanceTo(obj2.lastState.pos);

                        var collisionDistance = obj.radius + obj2.radius;

                        var collisionNormal = obj2.pos.clone().sub(obj.pos).normalize();

                        var lastPos = obj.lastState.pos;
                        var collisionFraction = (lastObjDist - collisionDistance) / (lastObjDist - objDist);

                        if (lastObjDist >= collisionDistance && objDist < collisionDistance) {
                            collisions.push({
                                withPlane: false,
                                object: obj,
                                withObject: obj2,
                                normal: collisionNormal,
                                fraction: collisionFraction
                            });
                        }
                    }
                }

                return collisions;
            };

            Simulator.prototype.checkResting = function checkResting(obj) {
                obj.restingAgainst = null;

                // check resting condition
                this._staticPlanes.forEach(function (plane) {
                    if (plane.normal.y != 1) {
                        return;
                    }

                    var normal = plane.normal;


                    var normalVel = obj.vel.clone().multiplyScalar(obj.vel.dot(normal));

                    if (normalVel.y > 0.05) {
                        return;
                    }

                    var planeDist = obj.pos.y - obj.radius - plane.point.y;

                    if (planeDist > 0.05) {
                        return;
                    }

                    obj.restingAgainst = plane;
                });
            };

            Simulator.prototype.addForce = function addForce(force) {
                this._forces.push(force);
            };

            Simulator.prototype.refreshDispaly = function refreshDispaly() {
                this._objects.forEach(function (obj) {
                    obj.updateGraphics();
                });
            };

            Simulator.prototype._getStaticPlaneCollisions = function _getStaticPlaneCollisions(obj) {
                var collisions = [];
                this._staticPlanes.forEach(function (plane) {
                    var point = plane.point;
                    var normal = plane.normal;


                    var objPlaneDist = obj.pos.clone().sub(point).dot(normal);
                    var lastObjPlaneDist = obj.lastState.pos.clone().sub(point).dot(normal);

                    if (objPlaneDist < obj.radius && lastObjPlaneDist > obj.radius) {
                        var d0 = lastObjPlaneDist - obj.radius;
                        var d1 = objPlaneDist - obj.radius;
                        var collisionFraction = d0 / (d0 - d1);

                        collisions.push({
                            withPlane: true,
                            normal: normal,
                            object: obj,
                            dist: objPlaneDist,
                            lastDist: lastObjPlaneDist,
                            fraction: collisionFraction
                        });
                    }
                });

                return collisions;
            };

            return Simulator;
        }();
    }, {}], 7: [function (require, module, exports) {
        var SceneObject = require('./SceneObject');

        module.exports = function (_SceneObject) {
            _inherits(SphereObject, _SceneObject);

            function SphereObject(pos, color) {
                _classCallCheck(this, SphereObject);

                var _this5 = _possibleConstructorReturn(this, _SceneObject.call(this, pos));

                _this5.name = color + " ball";

                var colorMap = {
                    red: 0xff0000,
                    green: 0x00ff00,
                    blue: 0x0000ff
                };

                var ballGeometry = new THREE.SphereGeometry(1, 32, 32);
                var ballMaterial = new THREE.MeshPhongMaterial({
                    color: colorMap[color],
                    specular: 0x009900,
                    shininess: 10
                });

                _this5._graphicsObject = new THREE.Mesh(ballGeometry, ballMaterial);

                var mousePickMaterial = new THREE.MeshBasicMaterial({
                    color: colorMap[color]
                });

                _this5._mousePickObject = new THREE.Mesh(ballGeometry, mousePickMaterial);
                return _this5;
            }

            return SphereObject;
        }(SceneObject);
    }, { "./SceneObject": 5 }], 8: [function (require, module, exports) {
        module.exports = function StaticPlane(point, normal) {
            _classCallCheck(this, StaticPlane);

            this.point = point;
            this.normal = normal;
        };
    }, {}], 9: [function (require, module, exports) {
        var EventEmitter = require('events');

        module.exports = function (_EventEmitter) {
            _inherits(UIControls, _EventEmitter);

            function UIControls() {
                _classCallCheck(this, UIControls);

                var _this6 = _possibleConstructorReturn(this, _EventEmitter.call(this));

                _this6._resetButton = $('#reset-button');
                _this6._resetButton.on('click', _this6._handleResetButtonClick.bind(_this6));

                _this6._containerShapeSelect = $('#container-shape-select select');
                _this6._containerShapeSelect.on('change', _this6._handleContainerShapeSelectChange.bind(_this6));

                _this6._stepSizeControls = {
                    container: $('#step-size-slider'),
                    slider: $('#step-size-slider input'),
                    display: $('#step-size-slider .val-display')
                };
                _this6._stepSizeControls.slider.on('change', _this6._handleSizeSliderChange.bind(_this6));

                _this6._elasticityControls = {
                    container: $('#elasticity-slider'),
                    slider: $('#elasticity-slider input'),
                    display: $('#elasticity-slider .val-display')
                };
                _this6._elasticityControls.slider.on('change', _this6._handleElasticityChange.bind(_this6));

                _this6._frictionCoeffControls = {
                    container: $('#friction-coeff-slider'),
                    slider: $('#friction-coeff-slider input'),
                    display: $('#friction-coeff-slider .val-display')
                };
                _this6._frictionCoeffControls.slider.on('change', _this6._handleFrictionCoeffChange.bind(_this6));

                _this6._airFrictionControls = {
                    container: $('#air-friction-slider'),
                    slider: $('#air-friction-slider input'),
                    display: $('#air-friction-slider .val-display')
                };
                _this6._airFrictionControls.slider.on('change', _this6._handleAirFrictionChange.bind(_this6));
                return _this6;
            }

            UIControls.prototype._handleContainerShapeSelectChange = function _handleContainerShapeSelectChange() {
                this.emit('container-shape-changed', this._containerShapeSelect.val());
            };

            UIControls.prototype._handleResetButtonClick = function _handleResetButtonClick() {
                this.emit('reset-button-clicked');
            };

            UIControls.prototype._handleSizeSliderChange = function _handleSizeSliderChange() {
                var value = this._stepSizeControls.slider.val();
                this._stepSizeControls.display.text(value);
                this.emit('step-size-changed', value);
            };

            UIControls.prototype._handleElasticityChange = function _handleElasticityChange() {
                var value = this._elasticityControls.slider.val();
                this._elasticityControls.display.text(value);
                this.emit('elasticity-changed', value);
            };

            UIControls.prototype._handleFrictionCoeffChange = function _handleFrictionCoeffChange() {
                var value = this._frictionCoeffControls.slider.val();
                this._frictionCoeffControls.display.text(value);
                this.emit('friction-coeff-changed', value);
            };

            UIControls.prototype._handleAirFrictionChange = function _handleAirFrictionChange() {
                var value = this._airFrictionControls.slider.val();
                this._airFrictionControls.display.text(value);
                this.emit('air-friction-changed', value);
            };

            return UIControls;
        }(EventEmitter);
    }, { "events": 1 }], 10: [function (require, module, exports) {
        var Force = require('./Force');
        var Gravity = require('./Gravity');
        var AirFriction = require('./AirFriction');
        var Simulator = require('./Simulator');
        var StaticPlane = require('./StaticPlane');
        var SphereObject = require('./SphereObject');
        var UIControls = require('./UIControls');

        var scene = new THREE.Scene();

        var props = {
            stepsPerFrame: 1,

            camera: null,
            cameraPos: {
                x: 9,
                y: 12,
                z: 15
            },

            gravity: null,
            airFriction: null,

            planes: [],
            cone: null,

            ball1: null,
            ball2: null,
            ball3: null,

            dragging: false,
            lastMousePos: null
        };

        var simulator = new Simulator();

        var renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(720, 500);
        renderer.setClearColor(0xffffff, 1);
        document.body.appendChild(renderer.domElement);

        renderer.domElement.onwheel = function (evt) {
            evt.preventDefault(0);
            var multiplier = 1 + evt.deltaY * 0.001;

            props.cameraPos.x *= multiplier;
            props.cameraPos.z *= multiplier;
            props.cameraPos.y *= multiplier;

            props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
            props.camera.lookAt(new THREE.Vector3(0, 0, 0));
        };

        renderer.domElement.onmousedown = function (evt) {
            props.dragging = true;

            props.lastMousePos = {
                x: evt.clientX,
                y: evt.clientY
            };
        };

        renderer.domElement.onmousemove = function (evt) {
            if (!props.dragging) {
                return;
            }

            var currMousePos = {
                x: evt.clientX,
                y: evt.clientY
            };

            var mousePosDiff = {
                x: currMousePos.x - props.lastMousePos.x,
                y: currMousePos.y - props.lastMousePos.y
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
        };

        renderer.domElement.onmouseup = function (evt) {
            props.dragging = false;
        };

        function initCamera() {
            props.camera = new THREE.PerspectiveCamera(75, 720 / 500, 0.1, 1000);

            props.camera.position.set(props.cameraPos.x, props.cameraPos.y, props.cameraPos.z);
            props.camera.lookAt(new THREE.Vector3(0, 0, 0));
        }

        function initContainer(shape) {
            simulator.clearStaticPlanes();

            var containerMaterial = new THREE.MeshPhongMaterial({
                color: 0x6666ff,
                specular: 0x000099,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });

            if (shape === 'box') {
                scene.remove(props.cone);

                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 1, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(-10, 0, 0), new THREE.Vector3(1, 0, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(10, 0, 0), new THREE.Vector3(-1, 0, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, -10), new THREE.Vector3(0, 0, 1)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1)));

                var planeGeometry = new THREE.PlaneGeometry(20, 20);
                var plane1 = new THREE.Mesh(planeGeometry, containerMaterial);
                plane1.position.set(0, 0, 10);
                scene.add(plane1);

                var plane2 = new THREE.Mesh(planeGeometry, containerMaterial);
                plane2.position.set(0, 0, -10);
                scene.add(plane2);

                var plane3 = new THREE.Mesh(planeGeometry, containerMaterial);
                plane3.position.set(-10, 0, 0);
                plane3.rotation.y = -Math.PI / 2;
                scene.add(plane3);

                var plane4 = new THREE.Mesh(planeGeometry, containerMaterial);
                plane4.position.set(10, 0, 0);
                plane4.rotation.y = -Math.PI / 2;
                scene.add(plane4);

                props.planes = [plane1, plane2, plane3, plane4];
            } else if (shape === 'pyramid') {
                props.planes.forEach(function (p) {
                    return scene.remove(p);
                });

                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 1, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(-10, -10, 0), new THREE.Vector3(0.866, -0.5, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(10, -10, 0), new THREE.Vector3(-0.866, -0.5, 0)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, -10), new THREE.Vector3(0, -0.5, 0.866)));
                simulator.addStaticPlane(new StaticPlane(new THREE.Vector3(0, -10, 10), new THREE.Vector3(0, -0.5, -0.866)));

                var coneGeometry = new THREE.ConeGeometry(7.07 * 2, 10 * 2, 4);

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
            var ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
            scene.add(ambientLight);

            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(0, 30, 30);
            scene.add(directionalLight);
        }

        function initControls() {
            var controls = new UIControls();

            controls.addListener('reset-button-clicked', throwIntoTheAir);

            controls.addListener('container-shape-changed', function (shape) {
                initContainer(shape);
            });

            controls.addListener('step-size-changed', function (val) {
                props.stepsPerFrame = val;
            });

            controls.addListener('elasticity-changed', function (val) {
                simulator.elasticity = val;
            });

            controls.addListener('friction-coeff-changed', function (val) {
                simulator.frictionCoeff = val;
            });

            controls.addListener('air-friction-changed', function (val) {
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
            for (var i = 0; i < props.stepsPerFrame; i++) {
                simulator.simulate(0.01 / props.stepsPerFrame);
            }

            simulator.refreshDispaly();

            renderer.render(scene, props.camera);

            requestAnimationFrame(simulate);
        }
        simulate();
    }, { "./AirFriction": 2, "./Force": 3, "./Gravity": 4, "./Simulator": 6, "./SphereObject": 7, "./StaticPlane": 8, "./UIControls": 9 }] }, {}, [10]);
