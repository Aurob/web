var Module = {
  initialized: false,
  c_kv_data: {},
  canvas: (function () { return document.getElementById('canvas'); })(),
  start: function () {
    let default_cells = 'f1.life'
    fetch(default_cells)
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        let cells = [];
        for (let y = 0; y < lines.length; y++) {
          for (let x = 0; x < lines[y].length; x++) {
            cells.push(lines[y][x] === 'X');
          }
        }
        cells = {
          'width': lines[0].length,
          'height': lines.length,
          'cells': cells,
          'cell_size': 1,
          'cell_count': cells.length,
        }
        console.log(cells);
        Module.js_to_c(cells);
      });
  },
  onRuntimeInitialized: function () {
    window.addEventListener('contextmenu', event => event.preventDefault());
    console.log("Runtime initialized");

    Module.start();
  },
  setkv: function (key, value) {
    Module.c_kv_data[key] = value;

    if (!Object.keys(Module.c_kv_data).includes(key)) {
      Module.c_kv_data[key] = value;
    }
  },
  js_to_c: function (str) {
    if (typeof str === 'object') {
      str = JSON.stringify(str);
    }
    var strPtr = Module._malloc(str.length + 1);
    Module.stringToUTF8(str, strPtr, str.length + 1);
    Module._load_json(strPtr);
    Module._free(strPtr);
  },

}