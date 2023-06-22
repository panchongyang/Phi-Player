import { Note } from "./note";
import { Position } from "./position";
import { noteType } from "./audios";
import { Game } from "./game";
import { Line } from "./line";

export class Drag extends Note {
    protected color: string = '#e4d722';
    protected type: noteType = 'drag';

    constructor(game: Game, line: Line, timing: number, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        super(game, line, timing, startPositon, options);
    }
}