import { Note } from "./note";
import { Position } from "./position";
import { noteType, playAudio } from "./audios";
import { relativelyX, relativelyY, speedNumber } from "./config";
import { rotatePoint } from "./until";

export class Hold extends Note {
    protected color: string = '#1b90ee88';
    protected type: noteType = 'hold';
    private endTiming: number;
    private long: number = 0;
    private timingSpeed: number = 0;
    private endPosition: Position = new Position(0, 0, 0);

    constructor(timing: number, endTiming: number, ctx: CanvasRenderingContext2D, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        super(timing, ctx, startPositon, options);
        this.endTiming = endTiming;
    }

    public setSpeeds(speeds: {
        start: number,
        value: number
    }[]) {
        this.speeds = speeds.sort((a, b) => a.start - b.start);
        this.speeds = [{ start: 0, value: 0 }, ...this.speeds, { start: 1000 * 60 * 60, value: 0 }];
        this.startY = this.speeds.reduce((pre, cur) => {
            if (cur.start < this.timing) {
                return {
                    value: pre.value - (cur.start - pre.lastTime) * pre.lastSpeed / speedNumber,
                    lastTime: cur.start,
                    lastSpeed: cur.value,
                    flag: false
                }
            } else {
                if (!pre.flag) {
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
        const _this = this;
        this.long = this.speeds.reduce((pre, cur) => {
            if (cur.start <= this.timing) {
                return {
                    value: 0,
                    lastTime: 0,
                    lastSpeed: cur.value,
                    flag: false
                }
            } else {
                if (!pre.flag) {
                    _this.timingSpeed = pre.lastSpeed;
                    return {
                        value: pre.value - (this.endTiming - this.timing) * pre.lastSpeed / speedNumber,
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
        if(this.bellow) {
            this.long = -this.long;
        }
        this.dropY = this.startY;
    }

    public setOffset(offset: number) {
        this.timing = this.timing - this.offset + offset;
        this.endTiming = this.endTiming - this.offset + offset;
        this.offset = offset;
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

    public nextFrame(time: number, linePosition: Position): Position {
        if(time > this.timing) {
            this.dropY = 0;
        } else {
            this.dropY = (this.bellow ? -1 : 1) * (this.startY - this.speeds.reduce((pre, cur) => {
                if (cur.start < time) {
                    return {
                        value: pre.value - (cur.start - pre.lastTime) * pre.lastSpeed / speedNumber,
                        lastTime: cur.start,
                        lastSpeed: cur.value,
                        flag: false
                    }
                } else {
                    if (!pre.flag) {
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
            }).value);
        }
        let off = (this.bellow ? -1 : 1) * (time > this.timing ? this.timingSpeed * (time - this.timing) / speedNumber: 0);
        this.lastFrameTime = time;
        let [x, y] = rotatePoint(this.startPosition.x + linePosition.x, this.dropY + linePosition.y, linePosition.x, linePosition.y, linePosition.r);
        let [xe, ye] = rotatePoint(this.startPosition.x + linePosition.x, this.dropY + this.long + linePosition.y + off, linePosition.x, linePosition.y, linePosition.r);
        this.position.setX(x);
        this.position.setY(y);
        this.endPosition.setX(xe);
        this.endPosition.setY(ye);
        return this.position;
    }

    public render(time: number, speed: number, linePosition: Position) {
        if (time - this.timing >= 0 && (this.status === 'drop' || this.status === 'juging')) {
            this.auto(time);
        }
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

        const x1 = this.ctxWidth / 2 + relativelyX(nextPosition.x) - this.width / 2 * Math.cos(linePosition.r * Math.PI / 180);
        const y1 = this.ctxHeight / 2 + relativelyY(nextPosition.y) - this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
        const x2 = this.ctxWidth / 2 + relativelyX(nextPosition.x) + this.width / 2 * Math.cos(linePosition.r * Math.PI / 180)
        const y2 = this.ctxHeight / 2 + relativelyY(nextPosition.y) + this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
        const x4 = this.ctxWidth / 2 + relativelyX(this.endPosition.x) - this.width / 2 * Math.cos(linePosition.r * Math.PI / 180);
        const y4 = this.ctxHeight / 2 + relativelyY(this.endPosition.y) - this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
        const x3 = this.ctxWidth / 2 + relativelyX(this.endPosition.x) + this.width / 2 * Math.cos(linePosition.r * Math.PI / 180)
        const y3 = this.ctxHeight / 2 + relativelyY(this.endPosition.y) + this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
        if (this.much && this.status === 'drop') {
            this.ctx.strokeStyle = '#e4d722';
            this.ctx.lineCap = 'square';
            this.ctx.lineWidth = 20;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        if (this.status === 'drop') {
            this.ctx.lineWidth = 16;
            this.ctx.lineCap = 'butt';
            this.ctx.fillStyle = this.color;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.lineTo(x3, y3);
            this.ctx.lineTo(x4, y4);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (this.status === 'juging') {
            const x1 = this.ctxWidth / 2 + relativelyX(nextPosition.x) - this.width / 2 * Math.cos(linePosition.r * Math.PI / 180);
            const y1 = this.ctxHeight / 2 + relativelyY(nextPosition.y) - this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
            const x2 = this.ctxWidth / 2 + relativelyX(nextPosition.x) + this.width / 2 * Math.cos(linePosition.r * Math.PI / 180)
            const y2 = this.ctxHeight / 2 + relativelyY(nextPosition.y) + this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
            const x4 = this.ctxWidth / 2 + relativelyX(this.endPosition.x) - this.width / 2 * Math.cos(linePosition.r * Math.PI / 180);
            const y4 = this.ctxHeight / 2 + relativelyY(this.endPosition.y) - this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
            const x3 = this.ctxWidth / 2 + relativelyX(this.endPosition.x) + this.width / 2 * Math.cos(linePosition.r * Math.PI / 180)
            const y3 = this.ctxHeight / 2 + relativelyY(this.endPosition.y) + this.width / 2 * Math.sin(linePosition.r * Math.PI / 180);
            this.ctx.lineWidth = 16;
            this.ctx.lineCap = 'butt';
            this.ctx.fillStyle = this.color;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.lineTo(x3, y3);
            this.ctx.lineTo(x4, y4);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // this.ctx.fillStyle = '#fff';
        // this.ctx.fillText(this.bellow + '', this.ctxWidth / 2 + relativelyX(nextPosition.x), this.ctxHeight / 2 + relativelyY(nextPosition.y));
    }

    public auto(time: number) {
        if (this.status === 'drop') {
            this.status = 'juging';
            if (!this.fake && time - this.timing > -80 && time - this.timing < 80) {
                playAudio('note');
            }
        } else if (this.status === 'juging') {
            if (time > this.endTiming) {
                console.log('ok')
                this.status = 'perfect';
            }
        }
    }

    public renderHitEffect(time: number) {
        if (this.fake || time - this.endTiming < 0 || time - this.endTiming > 240 && this.hitTime !== 0) {
            return;
        }
        if (this.hitTime === 0) {
            this.hitTime = time;
        }
        if(time < this.hitTime) {
            return ;
        }
        this.ctx.strokeStyle = "#e4d72288";
        const startX = this.ctxWidth / 2 + relativelyX(this.position.x) - (time - this.hitTime) / this.hitEffectTime * (this.width / 2);
        const startY = this.ctxHeight / 2 + relativelyY(this.position.y) - (time - this.hitTime) / this.hitEffectTime * (this.width / 2);
        this.ctx.strokeRect(startX, startY, (time - this.hitTime) / this.hitEffectTime * this.width, (time - this.hitTime) / this.hitEffectTime * this.width);
    }
}