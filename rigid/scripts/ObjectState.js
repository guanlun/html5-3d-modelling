module.exports = class ObjectState {
    constructor() {
        this.x = [0, 0, 0];
        this.p = [0, 0, 0];

        this.r = math.matrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]);

        this.l = [0, 0, 0];

        // const coeff = 1;

        // this.l = [
        //     (Math.random() - 0.5) * coeff,
        //     (Math.random() - 0.5) * coeff,
        //     (Math.random() - 0.5) * coeff
        // ];
    }
}
