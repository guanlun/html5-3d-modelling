const VecMath = require('./VecMath');

module.exports = class Strut {
    constructor(v1, v2, springLengthMultiplier, springCoeff, dampingCoeff) {
        this.v1 = v1;
        this.v2 = v2;

        this.l0 = VecMath.distance(v1.pos, v2.pos) * springLengthMultiplier;

        this.springCoeff = springCoeff / this.l0;

        this.dampingCoeff = dampingCoeff;
    }

    simulate() {
        const diff = VecMath.sub(this.v2.pos, this.v1.pos);
        const currDist = VecMath.dim(diff);
        const dir = VecMath.normalize(diff);

        const disp = currDist - this.l0;

        const acc1 = VecMath.add(VecMath.scalarMult(this.springCoeff * disp, dir), VecMath.scalarMult(-this.dampingCoeff, this.v1.vel));
        const acc2 = VecMath.add(VecMath.scalarMult(-this.springCoeff * disp, dir), VecMath.scalarMult(-this.dampingCoeff, this.v2.vel));

        this.v1.acc = VecMath.add(this.v1.acc, acc1);
        this.v2.acc = VecMath.add(this.v2.acc, acc2);
    }
}
