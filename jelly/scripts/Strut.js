const VecMath = require('./VecMath');

module.exports = class Strut {
    constructor(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;

        this.l0 = VecMath.distance(v1.pos, v2.pos);
    }

    simulate() {
        const diff = VecMath.sub(this.v2.pos, this.v1.pos);
        const currDist = VecMath.dim(diff);
        const dir = VecMath.normalize(diff);

        const disp = currDist - this.l0;

        

        this.v1.acc = VecMath.add(this.v1.acc, VecMath.scalarMult(0.1 * disp, dir));
        this.v2.acc = VecMath.add(this.v2.acc, VecMath.scalarMult(-0.1 * disp, dir));
    }
}
