
// Helper function to find rectangle intersection point
export function getIntersection(angle: number, width: number, height: number) {
    const w = width;
    const h = height;
    const x = Math.cos(angle);
    const y = Math.sin(angle);

    let sx: number;
    let sy: number;

    if (Math.abs(x) * h > Math.abs(y) * w) {
        // Intersects with vertical edge
        sx = w * Math.sign(x);
        sy = y * w / Math.abs(x);
    } else {
        // Intersects with horizontal edge
        sx = x * h / Math.abs(y);
        sy = h * Math.sign(y);
    }

    return { x: sx, y: sy };
}