module.exports = class Army {
    constructor(side) {
        this.side = side;
        this.soldiers = [];
    }

    simulate(state) {
        this.soldiers.forEach(s => {
            if  (this.side === 'red') {
                s.simulate(this, state.blueArmy);
            } else {
                s.simulate(this, state.redArmy);
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
        this.soldiers.push(s);
    }

    clear() {
        this.soldiers = [];
    }
}
