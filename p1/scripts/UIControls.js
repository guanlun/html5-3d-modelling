const EventEmitter = require('events');

module.exports = class UIControls extends EventEmitter {
    constructor() {
        super();

        this._stepSizeControls = {
            container: $('#step-size-slider'),
            slider: $('#step-size-slider input'),
            display: $('#step-size-slider .val-display'),
        };

        this._stepSizeControls.slider.on('mousemove', this._handleSizeSliderChange.bind(this));
    }

    _handleSizeSliderChange() {
        const value = this._stepSizeControls.slider.val();
        this._stepSizeControls.display.text(value);
        this.emit('step-size-changed', value);
    }
}
