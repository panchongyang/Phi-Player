

export class LEvent {
    start: number;
    end: number;
    type: string;
    startValue: number | 'extends';
    endValue: number;
    easeType: number = 0;
    timed: boolean = false;
    offset: number = 0;

    constructor(start: number, end: number, type: string, startValue: number | 'extends', endValue: number, easeType?: number) {
        this.start = start;
        this.end = end;
        this.type = type;
        this.startValue = startValue;
        this.endValue = endValue;
        if(easeType) {
            this.easeType = easeType <= -1 ? 0 : easeType;
        }
    }

    getNowValue(time: number): number {
        return 0;
    }
}