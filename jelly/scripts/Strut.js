const VecMath = require('./VecMath');

module.exports = class Strut {
    constructor(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;

        this.l0 = VecMath.distance(v1.pos, v2.pos);
    }

    simulate() {
        // console.log(VecMath.cross({x: 0, y: 1, z: 0}, {x: 1, y: 0, z: 0}));

        const diff = VecMath.sub(this.v2.pos, this.v1.pos);
        const currDist = VecMath.dim(diff);
        const dir = VecMath.normalize(diff);

        const disp = currDist - this.l0;

        const acc1 = VecMath.add(VecMath.scalarMult(0.01 * disp, dir), VecMath.scalarMult(-0.002, this.v1.vel));
        const acc2 = VecMath.add(VecMath.scalarMult(-0.01 * disp, dir), VecMath.scalarMult(-0.002, this.v2.vel));

        this.v1.acc = VecMath.add(this.v1.acc, acc1);
        this.v2.acc = VecMath.add(this.v2.acc, acc2);

        // this.v1.acc = VecMath.add(this.v1.acc, VecMath.scalarMult(0.1 * disp, dir));
        // this.v2.acc = VecMath.add(this.v2.acc, VecMath.scalarMult(-0.1 * disp, dir));
    }
}
