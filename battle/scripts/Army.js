module.exports = class Army {
    constructor(side) {
        this.side = side;
        this.soldiers = [];
    }

    simulate(frame, state) {
        this.soldiers.forEach(s => {
            if  (this.side === 'red') {
                s.simulate(frame, this, state.blueArmy);
            } else {
                s.simulate(frame, this, state.redArmy);
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
