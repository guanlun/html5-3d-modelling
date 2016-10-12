module.exports = class Obstacle {
    constructor(x, y, radius) {
        this.position = {
            x: x,
            y: y,
        };
        this.radius = radius;
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = '#999';
        ctx.arc(this.position.x, this.position.y, this.radius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
