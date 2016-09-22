module.exports = class Force {
    constructor() {
        this._value = null;
    }

    getValue() {
        return this._value;
    }

    apply(collider) {
        throw new Error('function `apply` is not implemented');
    }
}
