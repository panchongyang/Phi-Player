export class Position {
    x: number = 0;
    y: number = 0;
    r: number = 0;

    constructor(x: number, y: number, r: number) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    setX(x: number) {
        this.x = x;
    }

    setY(y: number) {
        this.y = y;
    }

    setR(r: number) {
        this.r = r;
    }
}