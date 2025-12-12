/*
    Recreation of musical notation using Web Audio API
    https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
    --------------------------------------------------------------
    Robert Aucoin
    version 0.1
    -------------

    NOTES AND TODO
    --------------
      Bass clef is 2 octaves and 2 notes below treble clef
       or simply, down 2 note names
        i.e F -> A, G -> B, A -> C, B -> D, C -> E, D -> F, E -> G
      TODO - implement key signatures
*/

var note_types = {
    '1': 1,
    '2': .5,
    '4': .25,
    '8': .125,
    '16': .0625,
};

var note_type_names = {
    '1': 'whole',
    '2': 'half',
    '4': 'quarter',
    '8': 'eighth',
    '16': 'sixteenth',
}

var type_name_notes = {
    'whole': '1',
    'half': '2',
    'quarter': '4',
    'eighth': '8',
    'sixteenth': '16',
};

var notes = {
    'r': 0,
    'a': 27.50,
    'a#': 29.14,
    'b♭': 29.14,
    'b': 30.87,
    'c': 32.70,
    'c#': 34.65,
    'd♭': 34.65,
    'd': 36.71,
    'd#': 38.89,
    'e♭': 38.89,
    'e': 41.20,
    'f': 43.65,
    'f#': 46.25,
    'g♭': 46.25,
    'g': 49.00,
    'g#': 51.91,
    'a♭': 51.91,
}

let transpose_offsets = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

let C_major_arpeggio = [
    notes["c"] * 2, notes["e"], notes["g"], notes["c"]
]

let D_major_arpeggio = [
    notes["d"] * 2, notes["f#"], notes["a"], notes["d"]
]

let E_major_arpeggio = [
    notes["e"] * 2, notes["g#"], notes["b"], notes["e"]
]

let F_major_arpeggio = [
    notes["f"] * 2, notes["a"], notes["c"], notes["f"]
]

const arpeggios = {
    "C_major_arpeggio": C_major_arpeggio,
    "D_major_arpeggio": D_major_arpeggio,
    "E_major_arpeggio": E_major_arpeggio,
    "F_major_arpeggio": F_major_arpeggio,

}

class MusicUtils {
    audioCtx;
    oscillators = {};

    constructor() {
    }

    new_oscillator(audioCtx, auto_start = true) {
        let oscillator = {};

        oscillator.id = this.rand_id();
        oscillator.frequency = 440;
        oscillator.connected = false;
        this.oscillators[oscillator.id] = oscillator;

        return oscillator;
    }

    async play_oscillator(audioCtx, frequency, duration = 0) {
        console.log(frequency)
        return beep(audioCtx, duration, frequency, 2);
    }

    delete_oscillator(oscillator) {
        oscillator.disconnect();
        oscillator.stop();

        delete this.oscillators[oscillator.id];
    }

    get_oscillator(id) {
        return this.oscillators[id];
    }

    rand_id() {
        return Math.random().toString(36).substr(2, 9); 
    }

    stop_oscillator(id) {
        
        for (let id_ in this.oscillators) {
            if(id == id_) {
                let oscillator = this.oscillators[id];
                oscillator.stop();
                oscillator.disconnect();
            }
        }
    }
    stop_all_oscillators() {
        for (let id in this.oscillators) {
            let oscillator = this.oscillators[id];
            oscillator.stop();
            oscillator.disconnect();
        }
    }

}

var music_utils = new MusicUtils();

class Composition {   
    oscillators = {};
    playing = false;
    constructor(measure_groups) {
        if(!measure_groups || !Array.isArray(measure_groups)) throw new Error('Composition must have at least 1 measure group');
        if(!measure_groups.length) throw new Error('Measure group must have at least 1 group');
        for(let i = 0; i < measure_groups.length; i++) {
            if(!measure_groups[i] instanceof(Measure)) throw new Error('Measure must be an instance of Measure');
        }

        this.measure_groups = measure_groups;
    } 

    play(loop = false) {
        
        if(this.playing) this.stop();
        this.playing = true;
        console.log(this.measure_groups)
        for(let i = 0; i < this.measure_groups.length; i++) {
            let measure = this.measure_groups[i];
            
            measure.play()
        }
    }

    stop() {
        
        this.playing = false;
        this.measure_groups.forEach(measure => {
            measure.stop(measure.oscillator_id);
        });
    }
}

class Measure {

    constructor(notes, notation) {

        //TODO
        // notes shouldn't have to be required. 
        // It may be useful to be able to create empty measures that notes can be added to later.
        if(!notes) throw new Error('No notes provided');
        else {
            if(!notes.length) throw new Error('No notes provided');
        }

        this.notes = notes;

        if(!notation) throw new Error('No notation provided');
        else {
            if(!notation.time_signature) throw new Error('No time signature provided');
            if(!notation.tempo) throw new Error('No tempo provided');
        }

        this.notation = notation;

    }

    async play() {

        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        for (let i = 0; i < this.notes.length; i++) {
            let note = this.notes[i];
            await note.play(this.audioCtx)
            .then(()=> {
            })
        }
    
    }

    stop(oscillator_id) {
        this.notes.forEach(note => {
            note.stop(oscillator_id);
        });
        this.audioCtx.close();
    }
}

class Note {
    constructor(type, pitch, octave, pitch_offset) {
        if(!type) throw new Error('No type provided');
        if(pitch == undefined) throw new Error('No pitch provided');
        if(!octave) throw new Error('No octave provided');

        this.type = type;
        this.pitch = pitch;
        this.octave = octave;
    }

    async play(audioCtx) {
        console.log(note_type_names[this.type], this.pitch, this.octave);
        return music_utils.play_oscillator(audioCtx, this.pitch, 2200 * note_types[this.type]);

    }

    stop(oscillator_id) {
        music_utils.stop_oscillator(oscillator_id);
    }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));