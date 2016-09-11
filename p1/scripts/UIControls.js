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

        this._elasticityControls = {
            container: $('#elasticity-slider'),
            slider: $('#elasticity-slider input'),
            display: $('#elasticity-slider .val-display'),
        };
        this._elasticityControls.slider.on('mousemove', this._handleElasticityChange.bind(this));

        this._frictionCoeffControls = {
            container: $('#friction-coeff-slider'),
            slider: $('#friction-coeff-slider input'),
            display: $('#friction-coeff-slider .val-display'),
        };
        this._frictionCoeffControls.slider.on('mousemove', this._handleFrictionCoeffChange.bind(this));
    }

    _handleSizeSliderChange() {
        const value = this._stepSizeControls.slider.val();
        this._stepSizeControls.display.text(value);
        this.emit('step-size-changed', value);
    }

    _handleElasticityChange() {
        const value = this._elasticityControls.slider.val();
        this._elasticityControls.display.text(value);
        this.emit('elasticity-changed', value);
    }

    _handleFrictionCoeffChange() {
        const value = this._frictionCoeffControls.slider.val();
        this._frictionCoeffControls.display.text(value);
        this.emit('friction-coeff-changed', value);
    }
}
