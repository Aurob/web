// P5JS setup and draw functions

var inputs = [];
var grid = [];
var gridw = 121;
var gridh = 121;
var cellwidth;
var cellheight;

var mouseCellX;
var mouseCellY;

var defaultWidth = 700;
var defaultHeight = 700;

var cell_color_overrides = [];

// var defaultCells = [
//   { 'x': 10, 'y': 10 }, { 'x': 10, 'y': 11 }, 
//   { 'x': 10, 'y': 12 }, { 'x': 11, 'y': 10 }, 
//   { 'x': 11, 'y': 11 }, { 'x': 11, 'y': 12 }, 
//   { 'x': 12, 'y': 10 }, { 'x': 12, 'y': 11 }, 
//   { 'x': 12, 'y': 12 }
// ];

var defaultCells;// = [  {    'x': 1,    'y': 2  },  {    'x': 2,    'y': 3  },  {    'x': 3,    'y': 1  },  {    'x': 3,    'y': 2  },  {    'x': 3,    'y': 3  }];

var step_delay = 1;

var glider = [
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
];

var custom_shape = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 0, 1],
];

var MusicalStates = {
  '1': [[1, 1, 2], [1, 1, 3], [1, 1, 4]], // Alive and 2, 3, or 4 neighbors
  '2': [[0, 0, 2]], // Dead and 2 neighbors
  '3': [[1, 0, 1]], // Alive and 1 neighbor
  '4': [[0, 1, 2]], // Dead and 2 neighbors
  '5': [[0, 0, 3]], // Dead and 3 neighbors
  '6': [[0, 0, 4]], // Dead and 4 neighbors
  '7': [[1, 0, 3]], // Alive and 3 neighbors
  '8': [[1, 0, 4]] // Alive and 4 neighbors
};

var canvas;
var r = 0;
class Cell {
  neighbors = [];
  constructor(x, y, color, state = 0) {
    this.x = x;
    this.y = y;
    this.color = color
    this.state = state;
    this.age = 0;
    this.last_state = -1;
  }

  loadNeighbors() {
    let x = this.x;
    let y = this.y;

    // Store the positions of each cell neighbor
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i == 0 && j == 0) {
          continue;
        }
        let neighbor = {
          x: x + i,
          y: y + j
        }
        neighbor = getCellByPosition(neighbor.x, neighbor.y)
        if (neighbor == -1) continue
        this.neighbors.push(grid[neighbor]);
      }
    }

  }

  checkNeighborStates() {

    let live_neighbors = 0;
    for (let i = 0; i < this.neighbors.length; i++) {
      let neighbor = this.neighbors[i];
      if (neighbor.state > 0) {
        live_neighbors++;
      }
    }
    return live_neighbors;
  }

  checkNeighborColors() {
    let neighbor_colors = [];
    for (let i = 0; i < this.neighbors.length; i++) {
      let neighbor = this.neighbors[i];
      neighbor_colors.push(neighbor.color);
    }
    return neighbor_colors;
  }

  getMusicalState(prevState, curState, neighborCount) {
    let musicalState;
    let collision = false;
  
    // let states = MusicalStates[${prevState}${curState}${neighborCount}]
    // if (states) {
    //   collision = true;
    //   musicalState = states;
    // }
  
    return { musicalState, collision };
  }
}

var speed_slider;
var pause_button;
var clear_button;
function setup() {
  createCanvas(defaultWidth, defaultHeight);

  // fetchAndParseCells('44P5H2V0.ca')
  convertCSVTOCells('ca3.txt?'+Math.random())
  // return new Promise((r, rj) => {
  //   defaultCells = true;
  //   r();

  // })
    .then(() => {
      angleMode(DEGREES);
      canvas = createGraphics(defaultWidth, defaultHeight);

      colorMode(HSB, 360, 100, 100);
      canvas.noStroke();

      // inputs.push(createSlider(-360, 360, 0, 1));
      makeGrid();
      
      // Load default cells
      // for (let i = 0; i < defaultCells.length; i++) {
      //   let cell = defaultCells[i];
      //   let grid_cell = getCellByPosition(cell.x, cell.y);
      //   if(grid_cell < 0) continue;
      //   grid[grid_cell].state = cell.state;
      // }



      cellwidth = defaultWidth / gridw;
      cellheight = defaultHeight / gridh;

      // Create shuffle button
      let shuffle_button = {
        name: "shuffle",
        button: createButton("Shuffle"),
      };

      inputs.push(shuffle_button);

      shuffle_button.button.mousePressed(shuffleCellColors);
      
      let restart_button = {
        name: "restart",
        button: createButton("Restart"),
      };

      inputs.push(restart_button);

      restart_button.button.mousePressed(restart);

      pause_button = {
        name: "pause",
        button: createButton("Pause"),
      };

      inputs.push(pause_button);

      pause_button.button.mousePressed(pauseBTN);
      
      speed_slider = createSlider(0, 1000, step_delay, .1).parent('#inputs');
      inputs.push({
        name: "speed",
        slider: speed_slider,
      });
      
      speed_slider.input(function() {
        step_delay = this.value();
      });

      // Create clear button
      clear_button = {
        name: "clear",
        button: createButton("Clear"),
      };

      inputs.push(clear_button);

      clear_button.button.mousePressed(clearCells);

    })
}

function makeGrid() {
  for (let i = 0; i < gridw; i++) {
    for (let j = 0; j < gridh; j++) {
      // let state =  Math.random() > 0.86 ? 1 : 0;
      let state;
      if(defaultCells) {
        let cell = defaultCells.find(c => c.x == i && c.y == j);
        if(cell) {
          state = cell.state;
        }
        else {
          state = 0;
        }
      }
      else {
        let xstate = Math.random() > 0.5 ? 1 : 0;
        let ystate = Math.random() > 0.5 ? 1 : 0;
        state = xstate * ystate;
       }
      grid.push(new Cell(i, j, color(0), state)); //color(255)
    }
  }
  // Load neighbors for each cell
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];
    cell.loadNeighbors();
  }
}

function clearCells() {
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];
    cell.state = 0;
  }
}

function pauseBTN() {
  if (speed_slider.value() == 0) {
    speed_slider.value(step_delay);
  }
  else {
    speed_slider.value(0);
  }
  

  // Change button label
  if (pause_button.button.html() == "Pause") {
    pause_button.button.html("Play");
  }
  else {
    pause_button.button.html("Pause");
  }

}

function restart() {
  // for (let i = 0; i < grid.length; i++) {
  //   let cell = grid[i];
  //   cell.state = defaultCells[i].state;
  // }
  grid = [];
  makeGrid();
}



var step = 0;
var last_step = 0;
function draw() {


  // Update the grid every second
  mouseCellX = Math.floor(mouseX / cellwidth)
  mouseCellY = Math.floor(mouseY / cellheight)

  
  if(mouseIsPressed) addGliderAtPosition(mouseCellX, mouseCellY);
  
  if (defaultCells) {
    // Increment step every second
    step = Math.floor(millis() / speed_slider.value());
    if (step != last_step) {
      last_step = step;
      canvas.background(255);
      // gridw = getInputFromName("gridw");
      // gridh = getInputFromName("gridh");
      // cellwidth = getInputFromName("cellwidth");
      // cellheight = getInputFromName("cellheight");

      // drawDEBUG();
      // drawTESTING();
      drawCA_TESTS();
      updateCells();
      push();
      // rotate(-r);
      image(canvas, 0, 0);
      // copy(canvas, 0, 0, width, height, -cellwidth, -cellheight, width, height);

      // copy(canvas, 0, 0, width, height, -cellwidth, -cellheight*gridh/2, width, height);

      // copy(canvas, 0, 0, width, height, -cellwidth*gridw/2, -cellheight, width, height);

      pop();
    }
    r++;
  }

}

function drawDEBUG() {
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];
    let x = cell.x;
    let y = cell.y;
    let hue = map(x, 0, gridw, 0, 360);
    let sat = map(y, 0, gridh, 0, 100);
    let bright = 100;
    canvas.fill(hue, sat, bright);
    canvas.rect(x * cellwidth, y * cellheight, cellwidth, cellheight);
  }
}

function drawTESTING() {
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];
    let x = cell.x;
    let y = cell.y;
    canvas.fill(cell.color);
    canvas.rect(x * cellwidth, y * cellheight, cellwidth, cellheight);
  }
}

function drawCA_TESTS() {
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];
    let x = cell.x;
    let y = cell.y;
    let state = cell.state;
    if (state != 0) {
      canvas.fill(cell.color);
    }
    else {
      canvas.fill(255);
    }

    if (x == mouseCellX && y == mouseCellY) {
      canvas.fill(0, 255, 0);
    }
    canvas.rect(x * cellwidth, y * cellheight, Math.ceil(cellwidth), Math.ceil(cellheight));
    grid[i].age++;
  }
}

function updateCells() {
  let grid_updates = [];
  console.log(1234)
  for (let i = 0; i < grid.length; i++) {

    let live_neighbors = grid[i].checkNeighborStates();
    if (grid[i].state == 0) {
      if (live_neighbors == 3) {
        let cell_update = {
          index: i,
          state: 1,
        };
        grid_updates.push(cell_update);
      }
    }
    else if (grid[i].state == 1) {
      if (live_neighbors <= 1 || live_neighbors >= 4) {
        let cell_update = {
          index: i,
          state: 0,
        };
        grid_updates.push(cell_update);
      }
    }
    
  }

  for (let i = 0; i < grid_updates.length; i++) {
    let cell_update = grid_updates[i];
    grid[cell_update.index].state = cell_update.state;
  }
}

function getCellByPosition(x, y) {
  for (let c = 0; c < grid.length; c++) {
    let cell = grid[c];
    if (cell.x == x && cell.y == y) return c;
  }

  return -1;
}

function addGliderAtPosition(x, y) {
  let glider = custom_shape;
  for (let i = 0; i < glider.length; i++) {
    for (let j = 0; j < glider[i].length; j++) {
      let index = getCellByPosition(x + i, y + j);
      if(index == -1) continue;
      let cell = grid[index];
      cell.state = glider[i][j];
    }
  }
}

function drawGliderAtPosition(x, y) {
  for (let i = 0; i < glider.length; i++) {
    for (let j = 0; j < glider[i].length; j++) {
      let cell = grid[getCellByPosition(x + i, y + j)];
      if (cell.state == 1) {
        canvas.fill(cell.color);
      }
      else {
        canvas.fill(0);
      }
      canvas.rect((x + i) * cellwidth, (y + j) * cellheight, cellwidth, cellheight);
    }
  }
}

function _createInput(name, type, min, max, value, step) {
  let input = {
    name: name,
    type: type,
    slider: createSlider(min, max, value, step),
    value: value,
  };
  inputs.push(input);
}

function randomColor() {
  let h = random(360);
  let s = random(100);
  let b = random(100);
  return color(h, s, b);
}

function getInputFromName(name, returnInput = false) {
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].name == name) {
      if (returnInput) {
        return inputs[i];
      }
    }
  }
}

function rgb2HSL(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function shuffleCellColors(t) {
  for (let i = 0; i < grid.length; i++) {
    grid[i].color = randomColor();
  }
}

async function fetchAndParseCells(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const cells = [];
    for (let y = 0; y < lines.length; y++) {
      for (let x = 0; x < lines[y].length; x++) {
        let state = lines[y][x] === 'X' ? 1 : 0;
        cells.push({
          x: x,
          y: y,
          state: state
        });
        // console.log(state)
      }
    }
    // return cells;
    // console.log(cells);
    defaultCells = cells;
  } catch (error) {
    console.error(error);
  }
}

async function convertCSVTOCells(csv) {
  try {
    const response = await fetch(csv);
    const text = await response.text();
    const lines = text.split('\n');
    // console.log(lines);
    var cells = [];
    for (let y = 0; y < lines.length; y++) {
      let line_cells = lines[y].split(',');
      for (let x = 0; x < line_cells.length; x++) {
        let state = line_cells[x] === 'X' ? 1 : 0;
        cells.push({
          x: x,
          y: y,
          state: state
        });
        // console.log(state)
      }
    }
    // return cells;
    // console.log(cells);
    defaultCells = cells;
  } catch (error) {
    console.error(error);
  }
}

function mousePressed() {
  // let cellIndex = getCellByPosition(mouseCellX, mouseCellY);
  // if(cellIndex != -1) {
  //   grid[cellIndex].state = 1;
  // }
  mousedown = true;
}