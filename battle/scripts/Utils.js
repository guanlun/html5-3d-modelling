module.exports = class Utils {
    static dim(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    }

    static sub(vec1, vec2) {
        return {
            x: vec1.x - vec2.x,
            y: vec1.y - vec2.y,
        };
    }

    static dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }

    static normalize(vec) {
        const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);

        return {
            x: vec.x / len,
            y: vec.y / len,
        };
    }

    static distance(vec1, vec2) {
        const diffX = vec1.x - vec2.x;
        const diffY = vec1.y - vec2.y;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    }
}
