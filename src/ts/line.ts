import { IRenderUnit } from "../util/unit";
import { IRenderer } from "../util/unit/renderer";
import { noteType } from "./audios";
import { height, relativelyX, relativelyY, speedNumber, width } from "./config";
import { Drag } from "./drag";
import { easeList } from "./ease";
import { Flick } from "./flick";
import { Game } from "./game";
import { Hold } from "./hold";
import { LEvent } from "./linevent";
import { Note } from "./note";
import { Position } from "./position";
import { getIntersections, rotatePoint } from "./until";

export interface NoteConfig {
    timing: number;
    startx: number;
    type: noteType;
    fake?: boolean;
    bellow?: boolean;
    endTiming?: number;
}


export class Line implements IRenderer {
    private id: number;
    private position: Position = new Position(0, 0, 0);
    public notes: (Note | Drag | Flick | Hold)[] = [];
    public events: LEvent[] = [];
    private width: number = width;
    private height: number = height;
    private ctx: CanvasRenderingContext2D;
    private color: string = 'rgba(255, 225, 33, 1)';
    private speed: number = 0;
    public offset: number = 0;
    public game: Game;
    public level: number = 1;

    constructor(game: Game, id: number, ctx: CanvasRenderingContext2D, speed: number, notes: NoteConfig[]) {
        this.game = game;
        this.id = id;
        this.ctx = ctx;
        this.speed = speed;
        const line = this;
        this.notes = notes.map((note, index) => {
            const startY = 0 - note.timing * this.speed / speedNumber;
            let r: Note | Drag;
            if (note.type === 'note') {
                r = new Note(game, line, note.timing, new Position(note.startx, startY, 0), {
                    fake: note.fake,
                    bellow: note.bellow
                });
            } else if (note.type === 'drag') {
                r = new Drag(game, line, note.timing, new Position(note.startx, startY, 0), {
                    fake: note.fake,
                    bellow: note.bellow
                });
            } else if (note.type === 'flicker') {
                r = new Flick(game, line, note.timing, new Position(note.startx, startY, 0), {
                    fake: note.fake,
                    bellow: note.bellow
                });
            } else {
                r = new Hold(game, line, note.timing, note.endTiming ?? 0, new Position(note.startx, startY, 0), {
                    fake: note.fake,
                    bellow: note.bellow,
                });
            }
            return r;
        });
    }

    public reset() {
        this.events.forEach((item) => {
            item.timed = false;
        });
        this.notes.forEach((item) => {
            item.reset(); 
        });
    }

    private nextFrame(time: number): Position {
        for (let index = 0; index < this.events.length; index++) {
            const event = this.events[index];
            if (event && !event.timed) {
                if (time > event.start && time < event.end) {
                    try {
                        let start: number = 0;
                        if(event.startValue === 'extends') {
                            switch (event.type) {
                                case 'r':
                                    start = this.position.r;
                                    break;
                                case 'x':
                                    start = this.position.x;
                                    break;
                                case 'y':
                                    start = this.position.y;
                                    break;
                                case 'o':
                                    start = parseFloat(this.color.split(',')[3].replace(')', '')) * 255;
                                    break;
                                case 's':
                                    start = this.speed;
                                    break;
                            }
                            event.startValue = start;
                        } else {
                            start = event.startValue
                        }
                        let nowValue = easeList[event.easeType](time - event.start, event.startValue, event.endValue - event.startValue, event.end - event.start);
                        if(Number.isNaN(nowValue)) {
                            if(event.endValue === event.startValue) {
                                nowValue = event.endValue;
                            } else {
                                nowValue = easeList[0](time - event.start, event.startValue as number, event.endValue - (event.startValue as number), event.end - event.start);
                            }
                        }
                        this.setNowValue(event.type, nowValue);
                    } catch(err) {
                        let nowValue = easeList[0](time - event.start, event.startValue as number, event.endValue - (event.startValue as number), event.end - event.start);
                        if(Number.isNaN(nowValue)) {
                            if(event.endValue === event.startValue) {
                                nowValue = event.endValue;
                            } else {
                                nowValue = easeList[0](time - event.start, event.startValue as number, event.endValue - (event.startValue as number), event.end - event.start);
                            }
                        }
                        this.setNowValue(event.type, nowValue);
                    }
                }
                if (time > event.end) {
                    event.timed = true;
                    this.setNowValue(event.type, event.endValue);
                }
            }
        }
        return this.position;
    }

    public setEvents(lineEvent: LEvent[]) {
        this.events = lineEvent.sort(function(a, b) {
            if (a.start < b.start) {
                return -1;
            } else if (a.start > b.start) {
                return 1;
            } else {
                if (a.end < b.end) {
                    return -1;
                } else if (a.end > b.end) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
        const speeds: {
            start: number,
            value: number
        }[] = [];
        lineEvent.forEach((item) => {
            if(item.type === 's') {
                speeds.push({
                    start: item.start,
                    value: item.endValue
                });
            }
        });
        speeds.sort((a, b) => {
            return b.start - a.start;
        });

        this.notes.forEach((note) => {
            note.setSpeeds(speeds);
        });
    }

    private setNowValue(type: string, nowValue: number) {
        switch (type) {
            case 'r':
                this.position.setR(nowValue);
                break;
            case 'x':
                this.position.setX(nowValue);
                break;
            case 'y':
                this.position.setY(nowValue);
                break;
            case 'o':
                this.color = `rgba(255, 225, 33, ${nowValue / 255 < 0 ? 0 : nowValue / 255 })`;
                break;
            case 's':
                this.speed = nowValue;
                break;
        }
    }

    public render(time: number) {
        const position = this.nextFrame(time);
        let startY = 0;
        let endY = 0;
        let startX = 0;
        let endX = this.width;
        if (position.r % 90 === 0 && position.r !== 0 && position.r % 180 !== 0) {
            startY = 0;
            endY = this.height;
            startX = this.width / 2 + relativelyX(position.x);
            endX = this.width / 2 + relativelyX(position.x);
        } else {
            const point = getIntersections(this.width/2 + relativelyX(position.x), this.height/2 + relativelyY(position.y), position.r);
            startX = point[0][0];
            startY = point[0][1];
            endX = point[1][0];
            endY = point[1][1];
        }
        this.ctx.beginPath();
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = this.color;
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        //this.ctx.fillText(this.id + '', this.width / 2 + relativelyX(position.x), this.height / 2 + relativelyY(position.y));
    }

    public renderNotes(time: number) {
        for (const note of this.notes) {
            this.game.layers.add(new IRenderUnit(note, note.level, time, this.position));
        }
    }

    public renderNext(time: number) {
        this.render(time);
    }

    public click(x: number, y: number) {

    }
}