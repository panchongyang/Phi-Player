import note from '../audios/note.mp3';
import drag from '../audios/drag.mp3';
import flicker from '../audios/flick.mp3';

export const noteAudio: HTMLAudioElement[] = [];
export const dragAudio: HTMLAudioElement[] = [];
export const flickAudio: HTMLAudioElement[] = [];

for(let i = 0;i < 20; i++) {
    const nAudio = new Audio(note);
    const dAudio = new Audio(drag);
    const fAudio = new Audio(flicker);
    nAudio.volume = 20/100;
    dAudio.volume = 20/100;
    fAudio.volume = 20/100;
    noteAudio.push(nAudio);
    dragAudio.push(dAudio);
    flickAudio.push(fAudio);
}

for(let i = 0;i < 20; i++) {
    const dAudio = new Audio(drag);
    dAudio.volume = 20/100;
    dragAudio.push(dAudio);
}

let nflag = 0;
let dflag = 0;
let fflag = 0;

export type noteType = 'drag' | 'note' | 'flicker' | 'hold';

export const playAudio = (type: noteType) => {
    if(type === 'drag') {
        dragAudio[dflag].play();
        dflag = (dflag + 1) % dragAudio.length;
    } else if(type === 'note') {
        noteAudio[nflag].play();
        nflag = (nflag + 1) % noteAudio.length;
    } else if(type === 'flicker') {
        flickAudio[fflag].play();
        fflag = (fflag + 1) % flickAudio.length;
    }
}