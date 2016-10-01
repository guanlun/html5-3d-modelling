const Utils = require('./Utils');

module.exports = class Sword {
    constructor() {
        this.length = 20;
        this.damage = 10;

        this.currAttackFrame = 0;

        this.startPos = {
            x: 2,
            y: -5,
        };

        this.offsetAngle = Math.PI / 4;

        this.status = 'holding';
    }

    attack(holder, target, facing) {
        if (this.status === 'holding') {
            this.status = 'out';
        }

        if (this.status === 'out') {
            this.currAttackFrame++;

            const pointing = facing - this.offsetAngle;

            const normalX = Math.cos(pointing);
            const normalY = Math.sin(pointing);

            const diff = {
                x: target.position.x - holder.position.x,
                y: target.position.y - holder.position.y,
            };

            const dist = Math.abs(diff.x * normalX + diff.y * normalY);

            if (dist < 5) {
                this.status = 'back';

                const combatDir = Utils.normalize(diff);
                const attackAngle = Utils.dot(combatDir, target.facing);

                const rand = Math.random();

                if (attackAngle < -0.5) {
                    if (rand > 0.9) {
                        target.receiveDamage(this.damage);
                    }
                } else {
                    if (rand > 0.2) {
                        target.receiveDamage(this.damage);
                    }
                }
            }
        } else if (this.status === 'back') {
            this.currAttackFrame--;

            if (this.currAttackFrame === 0) {
                this.status = 'holding';
            }
        }
    }

    render(ctx) {

        this.offsetAngle = Math.PI / 4 * (1 - this.currAttackFrame / 30);
        ctx.save();
        ctx.rotate(this.offsetAngle);

        ctx.beginPath();
        ctx.moveTo(2, -5);
        ctx.lineTo(2, -20);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}
