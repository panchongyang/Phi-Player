import { Note } from "./note";
import { Position } from "./position";
import { noteType } from "./audios";

export class Drag extends Note {
    protected color: string = '#e4d722';
    protected type: noteType = 'drag';

    constructor(timing: number, ctx: CanvasRenderingContext2D, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        super(timing, ctx, startPositon, options);
    }
}