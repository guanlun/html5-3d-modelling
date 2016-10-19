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

state.redArmy.display = document.getElementById('red-display');
state.blueArmy.display = document.getElementById('blue-display');

let frame = 0;

let currSoliderType = 'sword';

function loadPreset1() {
    state.redArmy.clear();
    state.blueArmy.clear();
    state.obstacles = [];

    for (let i = 0; i < 250; i++) {
        const x = Math.random() * 300 + 50;
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
    state.obstacles = [
    ];

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(200 + Math.random() * 2, 120 + 15 * i, 'sword'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(220 + Math.random() * 2, 125 + 15 * i, 'sword'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(240 + Math.random() * 2, 130 + 15 * i, 'sword'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(260 + Math.random() * 2, 125 + 15 * i, 'sword'));
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(750 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(800 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(850 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(900 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }
}

function loadPreset3() {
    state.redArmy.clear();
    state.blueArmy.clear();
    state.obstacles = [
    ];

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(200 + Math.random() * 2, 120 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(220 + Math.random() * 2, 125 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(240 + Math.random() * 2, 130 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(260 + Math.random() * 2, 125 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(750 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(800 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(850 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(900 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }
}

function loadPreset4() {
    state.redArmy.clear();
    state.blueArmy.clear();
    state.obstacles = [
        new Obstacle(600, 250, 150),
        new Obstacle(580, 500, 130),
        new Obstacle(400, 400, 100),
    ];

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(200 + Math.random() * 2, 120 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(220 + Math.random() * 2, 125 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(240 + Math.random() * 2, 130 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 40; i++) {
        state.redArmy.addSoldier(new Soldier(260 + Math.random() * 2, 125 + 15 * i, 'spear'));
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(750 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(800 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(850 + Math.random() * 2, i * 30 + 215);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 15; i++) {
        const horseman = new Horseman(900 + Math.random() * 2, i * 30 + 200);
        horseman.facing = {
            x: -1,
            y: 0,
        };
        state.blueArmy.addSoldier(horseman);
    }
}

function loadPreset5() {
    state.redArmy.clear();
    state.blueArmy.clear();

    state.obstacles = [];

    for (let i = 0; i < 20; i++) {
        state.obstacles.push(new Obstacle(1000 * Math.random(), 800 * Math.random(), 100));
    }

    return;

    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 100 + 50;
        const y = Math.random() * 500 + 100;

        state.redArmy.addSoldier(new Soldier(x, y, 'sword'));
    }

    const swordsman = new Soldier(250, 300, 'sword');

    swordsman.hp = 5000;
    swordsman.isGeneral = true;
    state.redArmy.addSoldier(swordsman);

    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 10 + 6000;
        const y = i * 30 + 150;

        const horseman = new Horseman(x, y);
        horseman.hp = 10;

        state.redArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 5 + 1000;
        const y = i * 30 + 250;

        const horseman = new Horseman(x, y);
        horseman.hp = 10;

        state.blueArmy.addSoldier(horseman);
    }

    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1 + 1100;
        const y = i * 12 + 50;

        state.blueArmy.addSoldier(new Soldier(x, y, 'shield'));
    }

    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1 + 1120;
        const y = i * 12 + 45;

        state.blueArmy.addSoldier(new Soldier(x, y, 'shield'));
    }

    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1 + 1150;
        const y = i * 12 + 50;

        state.blueArmy.addSoldier(new Soldier(x, y, 'spear'));
    }

    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 1 + 1170;
        const y = i * 12 + 45;

        state.blueArmy.addSoldier(new Soldier(x, y, 'spear'));
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

    state.obstacles = [];
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

document.getElementById('preset-btn-1').onclick = () => {
    loadPreset1();
}

document.getElementById('preset-btn-2').onclick = () => {
    loadPreset2();
}

document.getElementById('preset-btn-3').onclick = () => {
    loadPreset3();
}

document.getElementById('preset-btn-4').onclick = () => {
    loadPreset4();
}

document.getElementById('preset-btn-5').onclick = () => {
    loadPreset5();
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
    4: 'horseman',
}

window.onkeydown = (evt) => {
    const soliderType = keySoliderMapping[evt.key];

    if (soliderType !== undefined) {
        soldierSelect.value = soliderType;
        soldierSelect.onchange();
    }
}
