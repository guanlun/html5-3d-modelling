const VecMath = require('./VecMath');

module.exports = class Strut {
    constructor(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;

        this.l0 = VecMath.distance(v1, v2);
    }

    simulate() {
        const diff = VecMath.sub(this.v1, this.v2);
        const currDist = VecMath.dim(diff);
        const dir = VecMath.normalize(diff);

        // console.log(currDist, this.l0);

        const disp = currDist - this.l0;

        // console.log(disp);
        //
        this.v1.acc = VecMath.scalarMult(-0.5 * disp, dir);
        this.v2.acc = VecMath.scalarMult(0.5 * disp, dir);
    }
}
