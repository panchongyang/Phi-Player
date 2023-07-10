import { Note } from "./note";
import { Position } from "./position";
import { noteType } from "./audios";
import { Game } from "./game";
import { Line } from "./line";

export class Flick extends Note {
    protected color: string = '#eb4747';
    protected type: noteType = 'flicker';
    public level: number = 4;

    constructor(game: Game, line: Line, timing: number, startPositon: Position, options: {
        fake?: boolean,
        bellow?: boolean
    }) {
        super(game, line, timing, startPositon, options);
    }
}