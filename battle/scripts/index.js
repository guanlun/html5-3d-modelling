const Soldier = require('./Soldier');
const SpearMan = require('./SpearMan');
const ShieldMan = require('./ShieldMan');
const Army = require('./Army');

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const state = {
    simulating: false,
    redArmy: new Army('red'),
    blueArmy: new Army('blue'),
};

let frame = 0;

let currSoliderType = 'sword';

function loadPreset() {
    state.redArmy.clear();
    state.blueArmy.clear();

    state.redArmy.addSoldier(new Soldier(200, 200, 'sword'));
    state.redArmy.addSoldier(new Soldier(210, 250, 'sword'));
    state.redArmy.addSoldier(new Soldier(205, 300, 'sword'));
    state.redArmy.addSoldier(new Soldier(205, 350, 'sword'));
    state.redArmy.addSoldier(new Soldier(205, 400, 'sword'));

    state.blueArmy.addSoldier(new Soldier(500, 200, 'spear'));
    state.blueArmy.addSoldier(new Soldier(500, 280, 'spear'));
    state.blueArmy.addSoldier(new Soldier(500, 230, 'spear'));
    state.blueArmy.addSoldier(new Soldier(400, 200, 'shield'));
    state.blueArmy.addSoldier(new Soldier(400, 300, 'shield'));
    state.blueArmy.addSoldier(new Soldier(400, 230, 'shield'));
}

function simulate() {
    if (state.simulating) {
        state.redArmy.simulate(frame, state);
        state.blueArmy.simulate(frame, state);
    }

    context.clearRect(0, 0, 1200, 800);

    state.redArmy.render(context);
    state.blueArmy.render(context);

    requestAnimationFrame(simulate);

    frame++;
}

simulate();

const startButton = document.getElementById('start-btn');
startButton.onclick = () => {
    state.simulating = true;
}

const pauseButton = document.getElementById('pause-btn');
pauseButton.onclick = () => {
    state.simulating = false;
}

const clearButton = document.getElementById('clear-btn');
clearButton.onclick = () => {
    state.simulating = false;
    state.redArmy.clear();
    state.blueArmy.clear();
}

const soldierSelect = document.getElementById('soldier-select');
soldierSelect.onchange = (evt) => {
    if (soldierSelect.value === 'swordsman') {
        currSoliderType = 'sword';
    } else if (soldierSelect.value === 'shieldman'){
        currSoliderType = 'shield';
    } else {
        currSoliderType = 'spear';
    }
}

const presetButton = document.getElementById('preset-btn');
presetButton.onclick = () => {
    loadPreset();
}

canvas.onmouseup = (evt) => {
    evt.preventDefault();

    let selectedArmy;

    if (evt.button == 2) {
        selectedArmy = state.redArmy;
    } else {
        selectedArmy = state.blueArmy;
    }
    selectedArmy.addSoldier(new Soldier(evt.offsetX, evt.offsetY, currSoliderType));
}
