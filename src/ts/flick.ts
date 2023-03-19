import { Note } from "./note";
import { Position } from "./position";
import { noteType } from "./audios";

export class Flick extends Note {
    protected color: string = '#eb4747';
    protected type: noteType = 'flicker';

    constructor(timing: number, ctx: CanvasRenderingContext2D, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        super(timing, ctx, startPositon, options);
    }
}