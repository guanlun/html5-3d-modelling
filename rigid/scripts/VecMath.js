module.exports = class VecMath {
    static dim(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    }

    static add() {
        const result = {
            x: 0,
            y: 0,
            z: 0,
        };

        for (let i = 0; i < arguments.length; i++) {
            const v = arguments[i];
            result.x += v.x;
            result.y += v.y;
            result.z += v.z;
        }
        return result;
    }

    static sub(vec1, vec2) {
        return {
            x: vec1.x - vec2.x,
            y: vec1.y - vec2.y,
            z: vec1.z - vec2.z,
        };
    }

    static dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
    }

    static cross(vec1, vec2) {
        return {
            x: vec1.y * vec2.z - vec1.z * vec2.y,
            y: vec1.z * vec2.x - vec1.x * vec2.z,
            z: vec1.x * vec2.y - vec1.y * vec2.x,
        };
    }

    static scalarMult(s, v) {
        return {
            x: s * v.x,
            y: s * v.y,
            z: s * v.z,
        };
    }

    static scalarDiv(v, s) {
        return {
            x: v.x / s,
            y: v.y / s,
            z: v.z / s,
        };
    }

    static normalize(vec) {
        const len = VecMath.dim(vec);

        return {
            x: vec.x / len,
            y: vec.y / len,
            z: vec.z / len,
        };
    }

    static angleBetween(vec1, vec2) {
        const dotProduct = VecMath.dot(vec1, vec2);
        const dimProduct = VecMath.dim(vec1) * VecMath.dim(vec2);

        return dotProduct / dimProduct;
    }

    static distance(vec1, vec2) {
        const diffX = vec1.x - vec2.x;
        const diffY = vec1.y - vec2.y;
        const diffZ = vec1.z - vec2.z;

        return Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);
    }

    static isZeroVec(v) {
        return VecMath.dim(v) < 0.001;
    }
}
