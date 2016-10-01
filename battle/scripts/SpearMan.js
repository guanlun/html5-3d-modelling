const Soldier = require('./Soldier');

module.exports = class SpearMan extends Soldier {
    constructor(x, y) {
        super(x, y);

        this.attackInterval = 100;
        this.attackRangeCoeff = 1.5;
    }
}
