const Utils = require('./Utils');

const Sword = require('./Sword');
const Spear = require('./Spear');
const Shield = require('./Shield');

const CROSS_SIZE = 5;

module.exports = class Soldier {
    constructor(x, y, weaponType) {
        this.attackInterval = 60;
        this.speedLimit = 1;
        this.dimension = 5;

        this.hp = 100;

        this.position = {
            x: x,
            y: y,
        };

        this.velocity = {
            x: 0,
            y: 0,
        };

        this.facing = {
            x: 0,
            y: -1,
        };

        this.state = 'moving';
        this.target = null;

        this.alive = true;

        this.lastAttackFrame = 0;
        this.attackAnimationFrame = 0;

        switch (weaponType) {
            case 'sword':
                this.weapon = new Sword();
                this.maxMovingSpeed = 1.5;
                break;
            case 'spear':
                this.weapon = new Spear();
                this.maxMovingSpeed = 1.2;
                break;
            case 'shield':
                this.weapon = new Shield();
                this.maxMovingSpeed = 1.2;
                break;
        }
    }

    simulate(frame, friendly, enemy) {
        if (!this.alive) {
            return;
        }

        const target = this.findTarget(enemy.soldiers);

        if (target === null) {
            return;
        }

        const dist = this.distTo(target);
        this.facing.x = (target.position.x - this.position.x) / dist;
        this.facing.y = (target.position.y - this.position.y) / dist;

        if (this.state === 'moving') {
            this.target = target;

            let attackRange = dist;

            if (target.state === 'backing-up') {
                // Eneny backing-up, get closer before attacking
                attackRange *= 0.5;
            }

            if (attackRange > this.weapon.length) {
                this.velocity.x += this.facing.x * 0.1;
                this.velocity.y += this.facing.y * 0.1;

                if (Utils.dim(this.velocity) > this.maxMovingSpeed) {
                    this.velocity.x /= this.maxMovingSpeed;
                    this.velocity.y /= this.maxMovingSpeed;
                }

                friendly.soldiers.forEach(f => {
                    if (f === this || !f.alive) {
                        return;
                    }

                    // this.velocity.x += 0.01 * (f.velocity.x - this.velocity.x);
                    // this.velocity.y += 0.01 * (f.velocity.y - this.velocity.y);

                    const xDiff = f.position.x - this.position.x;
                    const yDiff = f.position.y - this.position.y;

                    const dist = Utils.distance(this.position, f.position);

                    if (dist < 10) {
                        this.velocity.x -= 2 / dist * xDiff;
                        this.velocity.y -= 2 / dist * yDiff;
                    }
                });

                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;

            } else {
                this.state = 'fighting';
            }
        } else if (this.state === 'fighting') {
            if (target !== this.target) {
                this.target = target;
                this.state = 'moving';
            }

            if (dist > this.weapon.length) {
                this.state = 'moving';
            } else if (dist < this.weapon.minRange) {
                this.state = 'backing-up';
            }

            // const target = this.target;
            if (target.alive) {
                this.attack(target, frame);
            } else {
                if (this.attackAnimationFrame >= this.attackInterval) {
                    this.state = 'moving';
                }
            }

            this.attackAnimationFrame++;
        } else if (this.state === 'backing-up') {
            if (dist > this.weapon.minRange) {
                this.state = 'fighting';
            }

            this.position.x -= this.facing.x * 0.3;
            this.position.y -= this.facing.y * 0.3;
        }
    }

    handleAttack(attackWeapon, angle) {
        const damage = this.weapon.defend(attackWeapon, angle);
        this.hp -= damage;

        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    attack(target, frame) {
        const facing = Math.atan2(this.facing.y, this.facing.x) + Math.PI / 2;

        this.weapon.attack(this, target, facing);
        // if (frame - this.lastAttackFrame > this.attackInterval) {
        //     this.attackAnimationFrame = 0;
        //     this.lastAttackFrame = frame;
        // } else {
        //     if (this.attackAnimationFrame === this.attackInterval / 2) {
        //         target.respondToAttack(this);
        //     }
        // }
    }

    respondToAttack(attacker) {
        let survivalRate;
        if (this.target === attacker) {
            // Focusing on the attacker
            survivalRate = 0.9;
        } else {
            // Fighting someone else, more likely to be killed
            survivalRate = 0.2;
        }

        if (Math.random() > survivalRate) {
            this.alive = false;
        }

        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    render(ctx, color) {
        const {x, y} = this.position;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        ctx.save();

        const facing = Math.atan2(this.facing.y, this.facing.x) + Math.PI / 2;
        ctx.translate(x, y);
        ctx.rotate(facing);

        ctx.beginPath();
        if (this.alive) {
            // if (this.state === 'fighting') {
            //     ctx.globalAlpha = 1;
            // } else {
            //     ctx.globalAlpha = 0.5;
            // }
            ctx.arc(0, 0, this.dimension, 0, Math.PI * 2);
            ctx.fill();

            this.weapon.render(ctx);

            // ctx.beginPath();
            // ctx.moveTo(2, -5);
            //
            // let weaponPos;
            //
            // if (this.attackAnimationFrame <= this.attackInterval / 2) {
            //     weaponPos = this.attackAnimationFrame * this.attackRangeCoeff;
            // } else {
            //     weaponPos = (this.attackInterval - this.attackAnimationFrame) * this.attackRangeCoeff;
            // }
            //
            // ctx.lineTo(2, -8 - weaponPos);
            // ctx.closePath();
            //
            // ctx.stroke();
        } else {
            ctx.moveTo(-CROSS_SIZE, -CROSS_SIZE);
            ctx.lineTo(CROSS_SIZE, CROSS_SIZE);
            ctx.closePath();

            ctx.moveTo(-CROSS_SIZE, CROSS_SIZE);
            ctx.lineTo(CROSS_SIZE, -CROSS_SIZE);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
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
