var canvas;
var ctx;

function init() {
    canvas = $('#main-canvas').get(0);
    ctx = canvas.getContext('webgl');
}

$(window).load(init);
