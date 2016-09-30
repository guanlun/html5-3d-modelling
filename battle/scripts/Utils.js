module.exports = class Utils {
    static normalize(vec2) {
        const len = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);

        vec2.x /= len;
        vec2.y /= len;
    }

    static distance(vec1, vec2) {
        const diffX = vec1.x - vec2.x;
        const diffY = vec1.y - vec2.y;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    }
}
