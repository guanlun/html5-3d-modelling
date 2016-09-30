const Utils = require('./Utils');

module.exports = class Soldier {
    constructor(x, y) {
        this.position = {
            x: x,
            y: y,
        };

        this.velocity = {
            x: Math.random() * 1 - 0.5,
            y: Math.random() * 1 - 0.5,
        };

        this.state = 'moving';
        this.target = null;

        this.alive = true;
    }

    simulate(friendly, enemy) {
        if (!this.alive) {
            return;
        }

        if (this.state === 'moving') {
            const target = this.findTarget(enemy.soldiers);
            if (target === null) {
                return;
            }

            const dist = this.distTo(target);

            this.target = target;

            if (dist > 24) {
                this.velocity.x = (target.position.x - this.position.x) / dist;
                this.velocity.y = (target.position.y - this.position.y) / dist;

                friendly.soldiers.forEach(f => {
                    if (f === this || !f.alive) {
                        return;
                    }

                    this.velocity.x += 0.01 * (f.velocity.x - this.velocity.x);
                    this.velocity.y += 0.01 * (f.velocity.y - this.velocity.y);

                    const xDiff = f.position.x - this.position.x;
                    const yDiff = f.position.y - this.position.y;

                    const dist = Utils.distance(this.position, f.position);

                    if (dist < 30) {
                        this.velocity.x -= 2 / dist * xDiff;
                        this.velocity.y -= 2 / dist * yDiff;
                    }
                });

                Utils.normalize(this.velocity);

                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;

            } else {
                this.velocity.x = 0;
                this.velocity.y = 0;

                this.state = 'fighting';
            }
        } else if (this.state === 'fighting') {
            const target = this.target;

            if (target.alive) {
                if (Math.random() > 0.99) {
                    target.alive = false;
                    this.state = 'moving';
                }
            } else {
                this.state = 'moving';
            }
        }
    }

    render(ctx, color) {
        const {x, y} = this.position;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        ctx.beginPath();
        if (this.alive) {
            if (this.state === 'fighting') {
                ctx.globalAlpha = 1;
            } else {
                ctx.globalAlpha = 0.5;
            }
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(x - 8, y - 8);
            ctx.lineTo(x + 8, y + 8);
            ctx.closePath();

            ctx.moveTo(x - 8, y + 8);
            ctx.lineTo(x + 8, y - 8);
            ctx.closePath();
            ctx.stroke();
        }
    }

    distTo(soldier) {
        const xDiff = soldier.position.x - this.position.x;
        const yDiff = soldier.position.y - this.position.y;

        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }

    findTarget(enemySoldiers) {
        let minDist = Number.MAX_VALUE;
        let target = null;

        for (let i = 0; i < enemySoldiers.length; i++) {
            const es = enemySoldiers[i];

            if (!es.alive) {
                continue;
            }

            const dist = this.distTo(es);

            if (dist < minDist) {
                minDist = dist;

                target = es;
            }
        }

        return target;
    }
}
