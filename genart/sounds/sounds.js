//create the context for the web audio
var context_loaded = false;
var audioCtx;

var oscillators = {};
var default_frequencies = [527, 205, 153, 310, 312, 476, 520, 102];

let notes = {
    "c": 32.75,
    "c#": 34.625,
    "d": 36.75,
    "d#": 39,
    "e": 41.25,
    "f": 43.75,
    "f#": 46.25,
    "g": 49,
    "g#": 52,
    "a": 55,
    "a#": 58.25,
    "b": 61.75
}

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

$('#new_freq').on('click', function () {
    new_oscillator();
});

function new_oscillator() {

    if (!context_loaded) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        context_loaded = true;
    }
    let id = Math.random().toString(36).substring(7);

    let oscillator = {
        'oscillator': audioCtx.createOscillator(),
        'running': false,
        'started': false,
        'step': 0,
        'stepN': .02,
        'size': 20,
        'last_point': [0, 0],
        'raux': Math.random() * 20,
        'n': Math.random() * 20,
        'r': Math.random() * 20,
        'color': [Math.random() * 255, Math.random() * 255, Math.random() * 255],
        'points': [],
        'perturb': Math.random() * 20,
    }
    oscillator.oscillator.frequency.value = 440;
    oscillators[id] = oscillator;

    let osc_box = $('<div class="oscillator" id="' + id + '"></div>');
    let range = $('<input type="range" min=0 max=1000 value=440 step=25 class="slider" id="freq_' + id + '">');
    let play = $('<button class="play" id="play_' + id + '">Play</button>');
    let remove = $('<button class="remove" id="remove_' + id + '">Remove</button>');
    $(osc_box).append(range);
    $(osc_box).append(play);
    $(osc_box).append(remove);
    $('#oscillators').append(osc_box);


    range.on('input', function () {
        var freq = $(this).val();
        var id = $(this).attr('id').split('_')[1];
        var oscillator = oscillators[id].oscillator;
        oscillator.frequency.value = freq;
    });

    play.on('click', function () {
        console.log(123);
        var id = $(this).attr('id').split('_')[1];
        var oscillator = oscillators[id];
        if (oscillator.started) {
            if (oscillator.running) {
                oscillator.oscillator.disconnect();
                oscillator.running = false;
            }
            else {
                oscillator.oscillator.connect(audioCtx.destination);
                oscillator.running = true;
            }
        }
        else {
            oscillator.oscillator.start();
            oscillator.oscillator.connect(audioCtx.destination);
            oscillator.running = true;
            oscillator.started = true;
        }
        $(this).text(oscillator.running ? 'Stop' : 'Play');
    });

    remove.on('click', function () {
        var id = $(this).attr('id').split('_')[1];
        var oscillator = oscillators[id];
        if (oscillator) {
            oscillator.oscillator.disconnect();
            if (oscillator.started) oscillator.oscillator.stop();
            delete oscillators[id];
            $('#' + id).remove();
        }
    });

    return id;
}

function set_query_frequencies() {
    const url = new URL(window.location);
    let sounds = [];
    for (var id in oscillators) {
        var oscillator = oscillators[id];
        if (oscillator.running) {
            sounds.push(oscillator.oscillator.frequency.value);
        }
    }

    url.searchParams.set('freqs', sounds.join(','));
    window.history.pushState(null, '', url.toString());
}

function get_query_frequencies() {
    var sounds = false;
    var url = new URL(window.location.href);
    var params = new URLSearchParams(url.search);
    var freqs = params.get('freqs');
    var new_ = params.get('new');
    if (new_ == '') sounds = 1;
    else if (freqs) {
        sounds = freqs.split(',');
    }

    return sounds;
}

function add_random_frequency(freq) {
    freq = freq || Math.floor(Math.random() * 1000);
    let id = new_oscillator();
    let oscillator = oscillators[id];
    oscillator.oscillator.frequency.value = freq;
    oscillator.oscillator.start();
    oscillator.oscillator.connect(audioCtx.destination);
    oscillator.running = true;
    oscillator.started = true;
    $('#freq_' + id).val(freq);
    $('#play_' + id).text('Stop');

}

function add_harmonic_oscillators() {
    //pick a random arpeggio
    let arpeggio = arpeggios[Object.keys(arpeggios)[Math.floor(Math.random() * Object.keys(arpeggios).length)]];
    let octave_multiplier = Math.floor(Math.random() * 20) + 2;
    for (let i = 0; i < arpeggio.length; i++) {
        let freq = arpeggio[i] * octave_multiplier;
        let id = new_oscillator();
        let oscillator = oscillators[id];
        oscillator.oscillator.frequency.value = freq;
        oscillator.oscillator.start();
        oscillator.oscillator.connect(audioCtx.destination);
        oscillator.running = true;
        oscillator.started = true;
        $('#freq_' + id).val(freq);
        $('#play_' + id).text('Stop');
    }

}

function clear_oscillators() {
    for (oscillator in oscillators) {
        oscillator = oscillators[oscillator];
        oscillator.oscillator.disconnect();
        oscillator.oscillator.stop();
    }
    oscillators = {};
    $('#oscillators').empty();
}

document.addEventListener('DOMContentLoaded', function () {
    var sounds = get_query_frequencies();
    if (!sounds) {
        sounds = default_frequencies;
    }

    for (var i = 0; i < sounds.length; i++) {
        document.getElementById('new_freq').click();
        var id = Object.keys(oscillators)[i];
        document.getElementById('freq_' + id).value = sounds[i];
        var event = new Event('input');
        document.getElementById('freq_' + id).dispatchEvent(event);
    }

    document.getElementById('play_all').addEventListener('click', function () {

        document.getElementById('rand').style.display = 'inline-block';

        if (Object.keys(oscillators).length == 0) return;
        for (var id in oscillators) {
            document.getElementById('play_' + id).click();
        }
        this.textContent = (this.textContent == 'Play All') ? 'Stop All' : 'Play All';
    });

    document.getElementById('rand').addEventListener('click', function () {
        // add_random_frequency();
        clear_oscillators();
        add_harmonic_oscillators();
    });

    var pathsHeader = document.createElement('div');
    pathsHeader.id = 'paths_header';
    pathsHeader.style.cssText = 'scrollbar-width: thin; display: flex; overflow-x: auto; width: 100% !important; height: min-content;';
    document.body.insertBefore(pathsHeader, document.body.firstChild);
    // fetch(`/all/allpaths.php`)
    //     .then(res => res.json())
    //     .then(data => {
    //         data.paths.forEach(link => {
    //             var linkDiv = document.createElement('div');
    //             linkDiv.className = 'all-header flex-item';
    //             var linkA = document.createElement('a');
    //             linkA.className = 'all-link link';
    //             linkA.href = '/' + link;
    //             linkA.textContent = link;
    //             linkDiv.appendChild(linkA);
    //             pathsHeader.appendChild(linkDiv);
    //         });
    //         var allHeaders = document.querySelectorAll('.all-header');
    //         allHeaders.forEach(function(header) {
    //             header.style.paddingRight = '.4em';
    //         });
    //     })
});
