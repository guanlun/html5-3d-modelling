const Soldier = require('./Soldier');
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

function loadPreset1() {
    state.redArmy.clear();
    state.blueArmy.clear();

    for (let i = 0; i < 320; i++) {
        const x = Math.random() * 300 + 100;
        const y = Math.random() * 500 + 150;

        state.redArmy.addSoldier(new Soldier(x, y, 'sword'));
    }

    for (let i = 0; i < 45; i++) {
        const x = 500 + Math.random() * 2;
        const y = 60 + i * 16;

        state.blueArmy.addSoldier(new Soldier(x, y, 'shield'));
    }

    for (let i = 0; i < 45; i++) {
        const x = 510 + Math.random() * 2;
        const y = 70 + i * 16;

        state.blueArmy.addSoldier(new Soldier(x, y, 'shield'));
    }

    for (let i = 0; i < 40; i++) {
        const x = 560 + Math.random() * 3;
        const y = 130 + i * 14;

        state.blueArmy.addSoldier(new Soldier(x, y, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        const x = 600 + Math.random() * 3;
        const y = 142 + i * 14;

        state.blueArmy.addSoldier(new Soldier(x, y, 'spear'));
    }
}

function loadPreset2() {
    state.redArmy.clear();
    state.blueArmy.clear();

    state.redArmy.addSoldier(new Soldier(200, 200, 'sword'));

    state.blueArmy.addSoldier(new Soldier(400, 200, 'spear'));
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
    } else if (soldierSelect.value === 'shieldman') {
        currSoliderType = 'shield';
    } else if (soldierSelect.value === 'archer') {
        currSoliderType = 'bow';
    } else {
        currSoliderType = 'spear';
    }
}

const presetButton1 = document.getElementById('preset-btn-1');
presetButton1.onclick = () => {
    loadPreset1();
}

const presetButton2 = document.getElementById('preset-btn-2');
presetButton2.onclick = () => {
    loadPreset2();
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
