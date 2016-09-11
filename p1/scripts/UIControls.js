const EventEmitter = require('events');

module.exports = class UIControls extends EventEmitter {
    constructor() {
        super();

        this._stepSizeSlider = document.getElementById('step-size-slider');

        this._stepSizeSlider.addEventListener('change', this._handleSizeSliderChange.bind(this));
    }

    _handleSizeSliderChange(event) {
        this.emit('step-size-changed', event);
    }
}
