module.exports = class ObjectState {
    constructor() {
        this.x = [0, 0, 0];
        this.p = [0, 0, 0];

        this.r = math.matrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]);

        const coeff = 0.2;

        this.l = [Math.random() * coeff, Math.random() * coeff, Math.random() * coeff];
    }
}
