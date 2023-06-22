import { Position } from "./position";
import { height, relativelyNumber, relativelyX, relativelyY, speedNumber, width } from "./config";
import { rotatePoint } from "./until";
import { noteType, playAudio } from "./audios";
import { Game } from "./game";
import { Line } from "./line";

export class Note {
    public startPosition: Position;
    public position: Position;
    public timing: number;
    public ctxWidth: number = width;
    public ctxHeight: number = height;
    public ctx: CanvasRenderingContext2D;
    public width: number = relativelyX(275 * relativelyNumber);
    public status: string = 'drop';
    public much: boolean = false;
    public hitTime: number = 0;
    public hitEffectTime: number = 240;
    public startY: number = 0;
    public dropY: number = 0;
    public lastFrameTime: number = 0;
    public game: Game;
    public line: Line;
    public noteHeight: number = relativelyY(24);
    public muchHeight: number = relativelyY(28);
    protected color: string = '#1b90ee';
    protected type: noteType = 'note';
    public fake: boolean = false;
    public offset: number = 0;
    public bellow: boolean = false;
    public speeds: {
        start: number,
        value: number
    }[] = [
        {start: 0, value:7}
    ];

    constructor(game: Game, line: Line, timing: number, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        this.timing = timing;
        this.ctx = game.ctx;
        this.position = startPositon;
        this.startPosition = new Position(startPositon.x, startPositon.y, startPositon.r);
        this.fake = options.fake ?? false;
        this.bellow = options.bellow ?? false;
        this.game = game;
        this.line = line;
    }

    public nextFrame(time: number, linePosition: Position): Position {
        if (time - this.timing >= 0 && this.status === 'drop') {
            this.auto(time);
        }
        this.dropY = this.startY - this.speeds.reduce((pre, cur) => {
            if(cur.start < time) {
                return {
                    value: pre.value - (cur.start - pre.lastTime) * pre.lastSpeed / speedNumber,
                    lastTime: cur.start,
                    lastSpeed: cur.value,
                    flag: false
                }
            } else {
                if(!pre.flag) {
                    if(pre.lastSpeed === 0) {
                        return{
                            value: pre.value - (time - pre.lastTime) * pre.lastSpeed / speedNumber,
                            lastTime: cur.start,
                            lastSpeed: cur.value,
                            flag: true
                        }
                    }
                    return {
                        value: pre.value - (time - pre.lastTime) * pre.lastSpeed / speedNumber,
                        lastTime: cur.start,
                        lastSpeed: cur.value,
                        flag: true
                    }
                } else {
                    return pre;
                }
            }
        }, {
            value: 0,
            lastTime: 0,
            lastSpeed: 7,
            flag: false
        }).value;
        if(this.bellow) {
            this.dropY = -this.dropY;
        }
        this.lastFrameTime = time;
        let [x, y] = rotatePoint(this.startPosition.x +  linePosition.x, this.dropY + linePosition.y, linePosition.x, linePosition.y, linePosition.r);
        this.position.setX(x);
        this.position.setY(y);
        return this.position;
    }

    public setSpeeds(speeds: {
        start: number,
        value: number
    }[]) {
        this.speeds = speeds.sort((a, b) => a.start - b.start);
        this.speeds = [{start: 0, value: 0}, ...this.speeds, {start: 1000 * 60 * 60 ,value: 0}];
        this.startY = this.speeds.reduce((pre, cur) => {
            if(cur.start < this.timing) {
                return {
                    value: pre.value - (cur.start - pre.lastTime) * pre.lastSpeed / speedNumber,
                    lastTime: cur.start,
                    lastSpeed: cur.value,
                    flag: false
                }
            } else {
                if(!pre.flag) {
                    return {
                        value: pre.value - (this.timing - pre.lastTime) * pre.lastSpeed / speedNumber,
                        lastTime: cur.start,
                        lastSpeed: cur.value,
                        flag: true
                    }
                } else {
                    return pre;
                }
            }
        }, {
            value: 0,
            lastTime: 0,
            lastSpeed: 0,
            flag: false
        }).value;
        this.dropY = this.startY;
    }

    public render(time: number, linePosition: Position) {
        if (this.status === 'perfect' && this.fake) {
            return;
        }
        if (this.hitTime !== 0 && time - this.hitTime > this.hitEffectTime) {
            return;
        }
        if (this.status === 'perfect' && !this.fake) {
            this.renderHitEffect(time);
            return;
        }
        const nextPosition = this.nextFrame(time, linePosition);

        const startX = this.ctxWidth / 2 + relativelyX(nextPosition.x) - this.width / 2 * Math.cos(linePosition.r * Math.PI / 180);
        const startY = this.ctxHeight / 2 + relativelyY(nextPosition.y) - this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
        const endX = this.ctxWidth / 2 + relativelyX(nextPosition.x) + this.width / 2 * Math.cos(linePosition.r * Math.PI / 180)
        const endY = this.ctxHeight / 2 + relativelyY(nextPosition.y) + this.width /2 * Math.sin(linePosition.r * Math.PI / 180);
        if (this.much) {
            this.ctx.strokeStyle = '#e4d722';
            this.ctx.lineCap = 'square';
            this.ctx.lineWidth = this.muchHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        this.ctx.lineCap = 'butt';
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.lineWidth = this.noteHeight;
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        // this.ctx.fillStyle = '#fff';
        // this.ctx.fillText(this.bellow + '', this.ctxWidth / 2 + relativelyX(nextPosition.x), this.ctxHeight / 2 + relativelyY(nextPosition.y));
    }

    public reset() {
        this.status = 'drop';
        this.hitTime = 0;
        this.dropY = 0;
    }

    public juge(time: number) {
        if (time - this.timing > -80 && time - this.timing < 80) {
            this.status = 'perfect';
            playAudio(this.type);
        } else if (time - this.timing > 80) {
            this.status = 'miss';
        }
    }

    public auto(time: number) {
        this.status = 'perfect';
        if (!this.fake && time - this.timing > -80 && time - this.timing < 80) {
            playAudio(this.type);
        }
    }

    public renderHitEffect(time: number) {
        if (this.fake || time - this.timing < 0 || time - this.timing > 240 && this.hitTime !== 0) {
            return;
        }
        if (this.hitTime === 0) {
            this.hitTime = time;
        }
        if(time < this.hitTime) {
            return ;
        }
        this.ctx.strokeStyle = "#e4d72288";
        this.ctx.lineWidth = relativelyY(10);
        const startX = this.ctxWidth / 2 + relativelyX(this.position.x) - (time - this.hitTime) / this.hitEffectTime * (this.width / 2);
        const startY = this.ctxHeight / 2 + relativelyY(this.position.y) - (time - this.hitTime) / this.hitEffectTime * (this.width / 2);
        this.ctx.strokeRect(startX, startY, (time - this.hitTime) / this.hitEffectTime * this.width, (time - this.hitTime) / this.hitEffectTime * this.width);
    }
}