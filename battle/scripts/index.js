const Soldier = require('./Soldier');
const Horseman = require('./Horseman');
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
        const y = Math.random() * 300 + 300;

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

    for (let i = 0; i < 15; i++) {
        const x = 100 + i * 25;
        const y = 50;

        state.blueArmy.addSoldier(new Horseman(x, y));
    }
}

function loadPreset2() {
    state.redArmy.clear();
    state.blueArmy.clear();

    for (let i = 0; i < 250; i++) {
        state.redArmy.addSoldier(new Soldier(Math.random() * 200 + 100, Math.random() * 300 + 150, 'spear'));
    }

    for (let i = 0; i < 50; i++) {
        state.blueArmy.addSoldier(new Horseman(Math.random() * 400 + 600, Math.random() * 200 + 200));
    }
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
    } else if (soldierSelect.value === 'spearman') {
        currSoliderType = 'spear';
    } else if (soldierSelect.value === 'horseman') {
        currSoliderType = 'horseman';
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

    if (currSoliderType === 'horseman') {
        selectedArmy.addSoldier(new Horseman(evt.offsetX, evt.offsetY));
    } else {
        selectedArmy.addSoldier(new Soldier(evt.offsetX, evt.offsetY, currSoliderType));
    }
}
