const SceneObject = require('./SceneObject');

module.exports = class SphereObject extends SceneObject {
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
