import { Line, NoteConfig } from "./line";
import { Note } from "./note";
import { Position } from "./position";
import { height, relativelyH, relativelyW, width } from "./config";
import { Game } from "./game";
import { beatToTime } from "./until";
import '../index.css';
import { LEvent } from "./linevent";
import JSZip from 'jszip';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
canvas.setAttribute('width', `${width}`);
canvas.setAttribute('height', `${height}`)

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

let data = '';
let music: HTMLAudioElement = document.getElementById('music') as HTMLAudioElement;
let img: Blob;

let count = 0;
const addCount = () => {
    count++;
    if (count === 2) {
        onReadyPlay();
    }
}

const folder: HTMLInputElement = document.getElementById("folder") as HTMLInputElement;
folder.onchange = async function (e) {
    console.log('载入文件...');
    let files:  {name: string , blob: Blob }[] = [];
    const zip = folder.files;
    const z = new JSZip();
    if(zip) {
        const zip_files = await z.loadAsync(zip[0]);
        for(const key in zip_files.files) {
            files.push({
                name: zip_files.files[key].name,
                blob: await zip_files.files[key].async('blob')
            });
        }
    }
    if (files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.endsWith(".pec")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    data = reader.result as string;
                    addCount();
                };
                reader.readAsText(file.blob);
                console.log('load data');
            }
            if (file.name.endsWith(".jpg") || file.name.endsWith(".png")) {
                img = file.blob;
                console.log('load image');
            }
            if (file.name.endsWith(".mp3") || file.name.endsWith(".ogg")) {
                music.src = URL.createObjectURL(file.blob);
                console.log('load music');
                addCount();
            }
            if (file.name.endsWith(".json")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        data = JSON.parse(reader.result as string);
                    } catch {
                        console.log('not json');
                        data = reader.result as string;
                    }
                    console.log('load data');
                    addCount();
                };
                reader.readAsText(file.blob);
            }
        }
    }
};

const onReadyPlay = () => {
    let lines: Line[] = [];
    if ((data as any).judgeLineList) {
        let bpm = 0;
        if ((data as any).BPMList) {
            bpm = (data as any).BPMList[0].bpm
        } else {
            bpm = (data as any).judgeLineList[0].bpm;
        }
        lines = (data as any).judgeLineList.map((item: any, index: number) => {
            let notes: NoteConfig[] = [];
            item.notes?.forEach((note: any) => {
                if (note.type === 1 || note.type === 2) {
                    notes.push({
                        timing: beatToTime(note.startTime, bpm),
                        startx: note.positionX * 3 / 4,
                        type: 'note',
                        fake: note.isFake === 1
                    });
                }
                if (note.type === 3) {
                    notes.push({
                        timing: beatToTime(note.startTime, bpm),
                        startx: note.positionX * 3 / 4,
                        type: 'flicker',
                        fake: note.isFake === 1
                    });
                }
                if (note.type === 4) {
                    notes.push({
                        timing: beatToTime(note.startTime, bpm),
                        startx: note.positionX * 3 / 4,
                        type: 'drag',
                        fake: note.isFake === 1
                    });
                }
            });
            const lEvent = item.eventLayers.reduce((pre: any[], cur: any) => {
                let events: LEvent[] = [];
                for (const key in cur) {
                    switch (key) {
                        case 'moveXEvents':
                            events = [...events, ...cur[key].map((event: any) => {
                                return new LEvent(beatToTime(event.startTime, bpm), beatToTime(event.endTime, bpm), 'x', event.start * 3 / 4, event.end * 3 / 4, event.easingType - 1);
                            })];
                            break;
                        case 'moveYEvents':
                            events = [...events, ...cur[key].map((event: any) => {
                                return new LEvent(beatToTime(event.startTime, bpm), beatToTime(event.endTime, bpm), 'y', -event.start * 3 / 4, -event.end * 3 / 4, event.easingType - 1);
                            })];
                            break;
                        case 'rotateEvents':
                            events = [...events, ...cur[key].map((event: any) => {
                                return new LEvent(beatToTime(event.startTime, bpm), beatToTime(event.endTime, bpm), 'r', event.start, event.end, event.easingType - 1);
                            })];
                            break;
                        case 'alphaEvents':
                            events = [...events, ...cur[key].map((event: any) => {
                                return new LEvent(beatToTime(event.startTime, bpm), beatToTime(event.endTime, bpm), 'o', event.start, event.end, event.easingType - 1);
                            })];
                            break;
                        case 'speedEvents':
                            events = [...events, ...cur[key].map((event: any) => {
                                return new LEvent(beatToTime(event.startTime, bpm), beatToTime(event.endTime, bpm), 's', event.start * 3 / 4, event.end * 3 / 4);
                            })];
                            break;
                        default:
                            break;
                    }
                }
                return [...pre, ...events];
            }, []);
            const line = new Line(index, ctx, 7, [...notes]);
            line.setEvents(lEvent);
            return line;
        });
    } else {
        let bpm = 0;
        const lineEvents: { [key: string]: LEvent[] } = {};
        const notes: { [key: string]: NoteConfig[] } = {};
        let lastCM: string;
        let lastCR: string;
        let lastCF: string;
        let lastCV: string;
        data.split('\n').forEach((item, index, originArr) => {
            // if(index === 0) {
            //     offset = parseInt(item);
            // }
            if (item.startsWith('bp')) {
                const arr = item.split(' ');
                bpm = parseInt(arr[2]);
            }
            if (item.startsWith('n4')) {
                const arr = item.split(' ');
                if (notes[`${arr[1]}`] === undefined) {
                    notes[`${arr[1]}`] = [];
                }
                notes[`${arr[1]}`].push({
                    timing: beatToTime([parseFloat(arr[2]), 0, 1], bpm),
                    startx: parseFloat(arr[arr.length - 3]) / 1024 * (relativelyW) / 2,
                    type: 'drag',
                    bellow: arr[4] === '2'
                });
            } else if (item.startsWith('n3')) {
                const arr = item.split(' ');
                if (notes[`${arr[1]}`] === undefined) {
                    notes[`${arr[1]}`] = [];
                }
                notes[`${arr[1]}`].push({
                    timing: beatToTime([parseFloat(arr[2]), 0, 1], bpm),
                    startx: parseFloat(arr[arr.length - 3]) / 1024 * (relativelyW) / 2,
                    type: 'flicker',
                    bellow: arr[4] === '2'
                });
            } else if (item.startsWith('n1')) {
                const arr = item.split(' ');
                if (notes[`${arr[1]}`] === undefined) {
                    notes[`${arr[1]}`] = [];
                }
                notes[`${arr[1]}`].push({
                    timing: beatToTime([parseFloat(arr[2]), 0, 1], bpm),
                    startx: parseFloat(arr[arr.length - 3]) / 1024 * (relativelyW) / 2,
                    type: 'note',
                    bellow: arr[4] === '2'
                });
            } else if (item.startsWith('n2')) {
                const arr = item.split(' ');
                if (notes[`${arr[1]}`] === undefined) {
                    notes[`${arr[1]}`] = [];
                }
                notes[`${arr[1]}`].push({
                    timing: beatToTime([parseFloat(arr[2]), 0, 1], bpm),
                    startx: parseFloat(arr[arr.length - 3]) / 1024 * (relativelyW) / 2,
                    type: 'hold',
                    bellow: arr[5] === '2',
                    endTiming: beatToTime([parseFloat(arr[3]), 0, 1], bpm)
                });
            }

            if (item.startsWith('cr')) {
                let start: number;
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[3]), 0, 1], bpm), 'r', 'extends', parseFloat(arr[4]), parseInt(arr[5]) - 1));
                lastCR = item;
            } else if (item.startsWith('cm')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[3]), 0, 1], bpm), 'x', 'extends', (parseFloat(arr[4]) - 1024) / 2048 * (relativelyW), parseInt(arr[6]) - 1));
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[3]), 0, 1], bpm), 'y', 'extends', -(parseFloat(arr[5]) - 700) / 1400 * (relativelyH), parseInt(arr[6]) - 1));
            } else if (item.startsWith('cf')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[3]), 0, 1], bpm), 'o', 'extends', parseFloat(arr[4]), 0));
            } else if (item.startsWith('cp')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[2]), 0, 1], bpm), 'x', 'extends', (parseFloat(arr[3]) - 1024) / 2048 * (relativelyW), 0));
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[2]), 0, 1], bpm), 'y', 'extends', -(parseFloat(arr[4]) - 700) / 1400 * (relativelyH), 0));
            } else if (item.startsWith('ca')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[2]), 0, 1], bpm), 'o', 0, parseFloat(arr[3]), 0));
            } else if (item.startsWith('cd')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[2]), 0, 1], bpm), 'r', 0, parseFloat(arr[3]), 0));
            } else if (item.startsWith('cv')) {
                const arr = item.split(' ');
                if (lineEvents[arr[1]] === undefined) {
                    lineEvents[arr[1]] = [];
                }
                lineEvents[`${arr[1]}`].push(new LEvent(beatToTime([parseFloat(arr[2]), 0, 1], bpm), beatToTime([parseFloat(arr[2]), 0, 1], bpm), 's', 0, parseFloat(arr[3]) * 0.9, 0));
            }


        });
        let keyLines: { [key: string]: Line } = {};
        for (const key in notes) {
            if (keyLines[key] === undefined) {
                keyLines[key] = new Line(parseInt(key), ctx, 7, notes[key]);
            }
        }
        for (const key in lineEvents) {
            lineEvents[key] = lineEvents[key].sort((a, b) => {
                return a.start - b.start
            });
            if (keyLines[key] === undefined) {
                const line = new Line(parseInt(key), ctx, 7, []);
                line.setEvents(lineEvents[key]);
                keyLines[key] = line;
            } else {
                keyLines[key].setEvents(lineEvents[key]);
            }
        }

        for (const key in keyLines) {
            keyLines[key].events.unshift(new LEvent(0, 0, 'y', 0, 175));
            lines.push(keyLines[key]);
        }
    }

    if (music !== null) {
        music.volume = 10 / 100;
        const game = new Game(ctx, music, img);
        const offsetEle = document.getElementById('offset') as HTMLInputElement;

        if (folder.files && offsetEle && offsetEle.value) {
            const offset = localStorage.getItem(folder.files[0].name);
            offsetEle.value = offset ? offset : '0';
        }
        (document.getElementById('save-offset') as HTMLButtonElement).onclick = () => {
            if (folder.files) {
                localStorage.setItem(folder.files[0].name, (document.getElementById('offset') as HTMLInputElement).value);
            }
        };

        (document.getElementById('reset') as HTMLButtonElement).onclick = () => {
            game.reset();
            folder.value = '';
            count = 0;
        };

        game.setLines(lines);

        music.onseeking = function () {
            game.pause();
            game.continue();
        };

        music.onpause = () => {
            game.pause();
        };

        music.onplay = (e) => {
            e.preventDefault();
            (document.getElementById('start') as HTMLButtonElement).click();
        }

        console.log('ok');
        (document.getElementById('start') as HTMLButtonElement).onclick = (e) => {
            if (game.status === 'none') {
                //canvas.requestFullscreen();

                game.start();

                const pause = document.getElementById('pause') as HTMLButtonElement;
                const replay = document.getElementById('replay') as HTMLButtonElement;
                const full = document.getElementById('full') as HTMLButtonElement;

                document.onkeydown = (e) => {
                    console.log(e.code);
                    if(e.code === 'ArrowRight') {
                        music.currentTime += 5;
                    }
                    if(e.code === 'ArrowLeft') {
                        music.currentTime -= 5;
                    }
                    if(e.code === 'Space') {
                        pause.click();
                    }
                    if(e.code === 'KeyR') {
                        replay.click();
                    }
                }
                full.onclick = () => {
                    canvas.requestFullscreen();
                }
                if (pause) {
                    pause.innerText = '暂停';
                }
                pause.onclick = () => {
                    if (pause.innerText === '暂停') {
                        game.pause();
                        pause.innerText = '继续';
                    } else {
                        game.continue();
                        pause.innerText = '暂停';
                    }
                };
                replay.onclick = () => {
                    game.replay();
                };
                window.onblur = () => {
                    if (pause?.innerText === '暂停') {
                        pause?.click();
                    }
                }
            }
        };
    }
};