const Soldier = require('./Soldier');
const Army = require('./Army');

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const state = {
    simulating: false,
    redArmy: new Army('red'),
    blueArmy: new Army('blue'),
};

state.selectedArmy = state.redArmy;

// state.redArmy.addSoldier(new Soldier(100, 100));
// state.redArmy.addSoldier(new Soldier(100, 140));
// state.redArmy.addSoldier(new Soldier(100, 180));
// state.redArmy.addSoldier(new Soldier(100, 220));
// state.redArmy.addSoldier(new Soldier(100, 260));
// state.redArmy.addSoldier(new Soldier(100, 300));

// state.blueArmy.addSoldier(new Soldier(200, 150));
// state.blueArmy.addSoldier(new Soldier(300, 120));
// state.blueArmy.addSoldier(new Soldier(250, 140));
// state.blueArmy.addSoldier(new Soldier(270, 130));
// state.blueArmy.addSoldier(new Soldier(290, 100));

function simulate() {
    if (state.simulating) {
        state.redArmy.simulate(state);
        state.blueArmy.simulate(state);
    }

    context.clearRect(0, 0, 1200, 800);

    state.redArmy.render(context);
    state.blueArmy.render(context);

    requestAnimationFrame(simulate);
}

simulate();

const startButton = document.getElementById('start-btn');
startButton.onclick = () => {
    state.simulating = true;
}

const clearButton = document.getElementById('clear-btn');
clearButton.onclick = () => {
    state.simulating = false;
    state.redArmy.clear();
    state.blueArmy.clear();
}

canvas.onclick = (evt) => {
    state.selectedArmy.addSoldier(new Soldier(evt.offsetX, evt.offsetY));
}

const armyToggle = document.getElementById('army-toggle');
armyToggle.onchange = () => {
    state.selectedArmy = (armyToggle.value === 'red') ? state.redArmy : state.blueArmy;
}
