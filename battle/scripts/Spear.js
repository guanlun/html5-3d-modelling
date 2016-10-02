const Utils = require('./Utils');

const Constants = require('./Constants');

module.exports = class Spear {
    constructor() {
        this.length = 60;
        this.minRange = 40;

        this.damage = 50;

        this.rotationSpeed = 0.04;

        this.currAttackFrame = 0;

        this.startPos = {
            x: 2,
            y: -5,
        };

        this.offsetPos = 20;

        this.status = 'holding';

        this.type = 'spear';
    }

    simulate(holder, target, facing) {
        if (this.status === 'out') {
            this.currAttackFrame++;

            if (this.currAttackFrame === 20) {
                this.status = 'back';
            }

            this.offsetPos = 20 - this.currAttackFrame;

            const reach = this.length - this.offsetPos;

            const headPos = {
                x: holder.position.x + reach * Math.sin(facing),
                y: holder.position.y - reach * Math.cos(facing),
            }

            const diff = {
                x: target.position.x - holder.position.x,
                y: target.position.y - holder.position.y,
            };

            const dist = Utils.dim(Utils.sub(headPos, target.position));

            if (dist < 5 && this.currAttackFrame > 10) {
                this.status = 'back';

                const combatDir = Utils.normalize(diff);
                const attackAngle = Utils.dot(combatDir, target.facing);

                target.handleAttack(this, attackAngle);
            }
        } else if (this.status === 'back') {
            this.currAttackFrame--;

            this.offsetPos = 20 - this.currAttackFrame;

            if (this.currAttackFrame === 0) {
                this.status = 'holding';
            }
        }
    }

    attack() {
        if (this.status === 'holding') {
            this.status = 'out';
        }
    }

    defend(attackWeapon, attackAngle) {
        const blockChance = Constants.BLOCK_CHANCE[this.type];

        const rand = Math.random();

        if (attackAngle < blockChance.angle) {
            if (rand > blockChance[attackWeapon.type]) {
                return attackWeapon.damage;
            }
        } else {
            if (rand > 0.2) {
                return attackWeapon.damage;
            }
        }

        return 0;
    }


    render(ctx) {

        // this.offsetAngle = Math.PI / 4 * (1 - this.currAttackFrame / 30);
        ctx.save();
        ctx.translate(0, this.offsetPos);
        // ctx.rotate(this.offsetAngle);

        ctx.beginPath();
        ctx.moveTo(this.startPos.x, this.startPos.y - this.length);
        ctx.lineTo(this.startPos.x, this.startPos.y);
        // ctx.lineTo(this.startPos.x - 2, this.startPos.y - this.length + 2);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}
