const Soldier = require('./Soldier');
const Horseman = require('./Horseman');
const Army = require('./Army');

const Obstacle = require('./Obstacle');

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const state = {
    simulating: false,
    redArmy: new Army('red'),
    blueArmy: new Army('blue'),

    obstacles: [],
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

    // for (let i = 0; i < 15; i++) {
    //     const x = 100 + i * 25;
    //     const y = 50;
    //
    //     state.blueArmy.addSoldier(new Horseman(x, y));
    // }
}

function loadPreset2() {
    state.redArmy.clear();
    state.blueArmy.clear();
    state.obstacles = [
        new Obstacle(600, 250, 150),
        new Obstacle(580, 500, 130),
        new Obstacle(400, 400, 100),
    ];

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(200, 120 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(220, 125 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(240, 130 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(750, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(800, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(850, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(900, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }
}

function simulate() {
    if (state.simulating) {
        state.redArmy.simulate(frame, state);
        state.blueArmy.simulate(frame, state);
    }

    context.clearRect(0, 0, 1440, 1000);

    state.obstacles.forEach(o => {
        o.render(context);
    });

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

const keySoliderMapping = {
    1: 'swordsman',
    2: 'spearman',
    3: 'shieldman',
    4: 'archer',
    5: 'horseman'
}

window.onkeydown = (evt) => {
    const soliderType = keySoliderMapping[evt.key];

    if (soliderType !== undefined) {
        soldierSelect.value = soliderType;
        soldierSelect.onchange();
    }
}
