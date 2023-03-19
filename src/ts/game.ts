import { height, width } from "./config";
import { Drag } from "./drag";
import { Line } from "./line";
import { Note } from "./note";

export class Game {
    private time: number = 0;
    private lines: Line[] = [];
    private notes: (Note | Drag)[] = [];
    private ctx: CanvasRenderingContext2D;
    private audio: HTMLAudioElement;
    private frameID: number = 0;
    private lastFrameTime: number = 0;
    private width: number = width;
    private height: number = height;
    private realTime: number = 0;
    public status: string = 'none';
    private img = new Image();
    public offset: number = 0;

    constructor(ctx: CanvasRenderingContext2D, audio: HTMLAudioElement, imgFile: Blob) {
        this.ctx = ctx;
        this.audio = audio;
        try {
            this.img.src = URL.createObjectURL(imgFile);
        } catch {
            console.log('not found img');
        }
    }

    public setLines(lines: Line[]) {
        this.lines = lines;
        for(const line of lines) {
            this.notes = [...this.notes, ...line.notes];
        }
        this.notes.sort((a, b) => b.timing - a.timing);
        let timing: number = -1;
        this.notes.forEach((note, index) => {
            if(note.timing === timing) {
                note.much = true;
                this.notes[index - 1].much = true;
            } else {
                timing = note.timing;
            }
        })
    }

    public setNotes(notes: Note[]) {
        this.notes = notes;
    }

    private setFrame() {
        const next = (time: number) => {
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = time;
            }
            this.time += time - this.lastFrameTime;
            this.realTime = time;
            try {
                this.nextFrame(this.time);
            } catch(err) {
                console.log(err);
            }
            this.lastFrameTime = time;
            this.frameID = requestAnimationFrame(next);
        }
        this.frameID = requestAnimationFrame(next);
    }

    start() {
        this.offset = parseInt((document.getElementById('offset') as HTMLInputElement).value);
        this.status = 'play';
        this.time = this.audio.currentTime * 1000 + this.offset;
        this.audio.play();
        this.setFrame();
    }

    pause() {
        this.audio.pause();
        cancelAnimationFrame(this.frameID);
    }

    continue() {
        this.lastFrameTime = 0;
        this.setTime(this.audio.currentTime * 1000 + this.offset);
        setTimeout(() => {
            this.audio.play();
            this.setFrame();   
        });
    }

    setTime(time: number) {
        this.time = time;
        this.lines.forEach((line) => {
            line.notes.forEach((note) => {
                if(note.timing > time) {
                    note.reset();
                }
            });
            line.events.forEach((e) => {
                e.timed = false;
            });
        });
        this.nextFrame(time);
    }

    replay() {
        cancelAnimationFrame(this.frameID);
        this.audio.load();
        this.lastFrameTime = 0;
        this.time = 0;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = '#000000dd';
        this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height,0, 0, width, height);
        this.ctx.fillRect(0, 0, width, height);

        this.lines.forEach((item) => {
            item.reset();
        });

        setTimeout(() => {
            this.start();
        });
    }

    reset() {
        cancelAnimationFrame(this.frameID);
        this.audio.load();
        this.ctx.clearRect(0, 0, width, height);
    }

    private nextFrame(time: number) {
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = '#000000dd';
        this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height,0, 0, width, height);
        this.ctx.fillRect(0, 0, width, height);
        for (const line of this.lines) {
            line.renderNext(time);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${Math.floor(1000 / (this.realTime - this.lastFrameTime))}`, width - 40, 20);
    };
}