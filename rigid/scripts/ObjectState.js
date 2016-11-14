module.exports = class ObjectState {
    constructor() {
        this.x = [0, 0, 0];
        this.p = [0, 0, 0];

        this.r = math.matrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]);

        this.l = [0, 0.01, 0.01];

        // this.r = math.matrix([
        //     [0.866, 0.5, 0],
        //     [-0.5, 0.866, 0],
        //     [0, 0, 1],
        // ]);
    }
}
