module.exports = class Army {
    constructor(side) {
        this.side = side;
        this.soldiers = [];
    }

    simulate(frame, state) {
        this.soldiers.forEach(s => {
            if (this.side === 'red') {
                s.simulate(frame, this, state.blueArmy, state.obstacles, this.isDefending);
            } else {
                s.simulate(frame, this, state.redArmy, state.obstacles, this.isDefending);
            }
        });
    }

    render(ctx) {
        const color = this.side;
        this.soldiers.forEach(s => {
            s.render(ctx, color);
        });
    }

    addSoldier(s) {
        s.army = this;

        if (this.side === 'red') {
            s.facing = {
                x: 1,
                y: 0,
            };
        } else {
            s.facing = {
                x: -1,
                y: 0,
            };
        }
        this.soldiers.push(s);

        this.display.innerHTML = this.soldiers.length;
    }

    handleSoldierDeath() {
        this.display.innerHTML = parseInt(this.display.innerHTML) - 1;
    }

    clear() {
        this.soldiers = [];
    }
}
