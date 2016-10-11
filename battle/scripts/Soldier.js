const Utils = require('./Utils');

const Sword = require('./Sword');
const Spear = require('./Spear');
const Shield = require('./Shield');
const Bow = require('./Bow');

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
                this.maxMovingSpeed = 0.9;
                break;
            case 'spear':
                this.weapon = new Spear();
                this.maxMovingSpeed = 0.5;
                break;
            case 'shield':
                this.weapon = new Shield();
                this.maxMovingSpeed = 0.5;
                break;
            case 'bow':
                this.weapon = new Bow();
                this.maxMovingSpeed = 0.7;
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

        const newFacingX = (target.position.x - this.position.x) / dist;
        const newFacingY = (target.position.y - this.position.y) / dist;
        const newFacingAngle = Math.atan2(newFacingY, newFacingX);
        let currFacingAngle = Math.atan2(this.facing.y, this.facing.x);

        const rotationSpeed = this.weapon.rotationSpeed;

        if (newFacingAngle > currFacingAngle) {
            if (newFacingAngle - currFacingAngle < Math.PI) {
                currFacingAngle = Math.min(newFacingAngle, currFacingAngle + rotationSpeed);
            } else {
                currFacingAngle = Math.min(newFacingAngle, currFacingAngle - rotationSpeed);
            }
        } else {
            if (currFacingAngle - newFacingAngle < Math.PI) {
                currFacingAngle = Math.max(newFacingAngle, currFacingAngle - rotationSpeed);
            } else {
                currFacingAngle = Math.max(newFacingAngle, currFacingAngle + rotationSpeed);
            }
        }

        this.facing.x = Math.cos(currFacingAngle);
        this.facing.y = Math.sin(currFacingAngle);

        if (this.state === 'moving') {
            this.target = target;

            if (dist > this.weapon.length) {
                this.velocity.x += this.facing.x * 0.02;
                this.velocity.y += this.facing.y * 0.02;

                if (Utils.dim(this.velocity) > this.maxMovingSpeed) {
                    this.velocity = Utils.normalize(this.velocity);

                    this.velocity.x *= this.maxMovingSpeed;
                    this.velocity.y *= this.maxMovingSpeed;
                    // this.velocity.x /= this.maxMovingSpeed;
                    // this.velocity.y /= this.maxMovingSpeed;
                }

                friendly.soldiers.forEach(f => {
                    if (f === this || !f.alive) {
                        return;
                    }

                    // this.velocity.y += 0.01 * (f.velocity.y - this.velocity.y);
                    // this.velocity.x += 0.01 * (f.velocity.x - this.velocity.x);

                    const xDiff = f.position.x - this.position.x;
                    const yDiff = f.position.y - this.position.y;

                    const dist = Utils.distance(this.position, f.position);

                    if (dist < 10) {
                        this.velocity.x -= 0.5 / dist * xDiff;
                        this.velocity.y -= 0.5 / dist * yDiff;
                    }
                });

                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;

            } else if (dist < this.weapon.minRange) {
                this.state = 'backing-up';

            } else {
                this.attack(target, frame);
            }
        } else if (this.state === 'backing-up') {
            if (dist > this.weapon.minRange) {
                this.state = 'moving';
            }

            this.position.x -= this.facing.x * 0.5;
            this.position.y -= this.facing.y * 0.5;
        }

        const facing = Math.atan2(this.facing.y, this.facing.x) + Math.PI / 2;

        this.weapon.simulate(this, target, facing);
    }

    handleAttack(attackWeapon, angle) {
        const damage = this.weapon.defend(attackWeapon, angle);

        if (damage > 0) {
            this.hp -= damage;

            this.velocity.x = 0;
            this.velocity.y = 0;

            if (this.hp <= 0) {
                this.alive = false;
            }
        }
    }

    attack(target, frame) {
        this.weapon.attack();
    }

    renderAlive(ctx) {
        ctx.arc(0, 0, this.dimension, 0, Math.PI * 2);
        ctx.fill();

        this.weapon.render(ctx);
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
            this.renderAlive(ctx);
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

    findTarget(enemySoldiers, angle) {
        if (angle === undefined) {
            angle = Math.PI;
        }

        let minDist = Number.MAX_VALUE;
        let target = null;

        for (let i = 0; i < enemySoldiers.length; i++) {
            const es = enemySoldiers[i];

            if (!es.alive) {
                continue;
            }

            const diff = Utils.sub(es.position, this.position);
            if (Utils.angleBetween(diff, this.facing) < Math.cos(angle)) {
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
