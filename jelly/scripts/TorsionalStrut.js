const VecMath = require('./VecMath');

module.exports = class TorsionalStrut {
    constructor(v0, v1, v2, v3) {
        this.torqueCoeff = 0.1;

        this.x0 = v0;
        this.x1 = v1;
        this.x2 = v2;
        this.x3 = v3;

        const x01 = VecMath.sub(this.x1.pos, this.x0.pos);
        const l01 = VecMath.dim(x01);

        const h_u = VecMath.scalarDiv(x01, l01);

        const x02 = VecMath.sub(this.x2.pos, this.x0.pos);
        const d02 = VecMath.dot(x02, h_u);

        const x03 = VecMath.sub(this.x3.pos, this.x0.pos);
        const d03 = VecMath.dot(x03, h_u);

        const r_l = VecMath.sub(x02, VecMath.scalarMult(d02, h_u));
        const r_r = VecMath.sub(x03, VecMath.scalarMult(d03, h_u));

        const n_l = VecMath.normalize(VecMath.cross(x01, x02));
        const n_r = VecMath.normalize(VecMath.cross(x03, x01));

        this.theta0 = Math.atan2(VecMath.dot(VecMath.cross(n_l, n_r), h_u), VecMath.dot(n_l, n_r));
    }

    simulate(t) {
        const x01 = VecMath.sub(this.x1.pos, this.x0.pos);
        const l01 = VecMath.dim(x01);

        const h_u = VecMath.scalarDiv(x01, l01);

        const x02 = VecMath.sub(this.x2.pos, this.x0.pos);
        const d02 = VecMath.dot(x02, h_u);

        const x03 = VecMath.sub(this.x3.pos, this.x0.pos);
        const d03 = VecMath.dot(x03, h_u);

        const r_l = VecMath.sub(x02, VecMath.scalarMult(d02, h_u));
        const r_r = VecMath.sub(x03, VecMath.scalarMult(d03, h_u));

        const n_l = VecMath.normalize(VecMath.cross(x01, x02));
        const n_r = VecMath.normalize(VecMath.cross(x03, x01));

        const theta = Math.atan2(VecMath.dot(VecMath.cross(n_l, n_r), h_u), VecMath.dot(n_l, n_r));

        const torque = VecMath.scalarMult(this.torqueCoeff * (theta - this.theta0), h_u);

        const f3 = VecMath.scalarMult(VecMath.dot(torque, h_u) / VecMath.dim(r_r), n_r);
        const f2 = VecMath.scalarMult(VecMath.dot(torque, h_u) / VecMath.dim(r_l), n_l);
        const f1 = VecMath.scalarDiv(VecMath.add(VecMath.scalarMult(d02, f2), VecMath.scalarMult(d03, f3)), -l01);
        const f0 = VecMath.scalarMult(-1, VecMath.add(f1, VecMath.add(f2, f3)));

        this.x0.acc = VecMath.add(this.x0.acc, f0);
        this.x1.acc = VecMath.add(this.x1.acc, f1);
        this.x2.acc = VecMath.add(this.x2.acc, f2);
        this.x3.acc = VecMath.add(this.x3.acc, f3);
    }
}
