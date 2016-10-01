const Soldier = require('./Soldier');

module.exports = class ShieldMan extends Soldier {
    constructor(x, y) {
        super(x, y);

        this.attackInterval = 100;
        this.attackRangeCoeff = 0.5;
    }

    attack(target, frame) {
        if (frame - this.lastAttackFrame > this.attackInterval) {
            this.attackAnimationFrame = 0;
            this.lastAttackFrame = frame;
        }
    }

    respondToAttack(attacker) {
        let survivalRate;
        if (this.target === attacker) {
            // Focusing on the attacker
            survivalRate = 0.98;
        } else {
            // Fighting someone else, more likely to be killed
            survivalRate = 0.9;
        }

        if (Math.random() > survivalRate) {
            this.alive = false;
        }

        this.velocity.x = 0;
        this.velocity.y = 0;
    }
}
