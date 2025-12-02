// # Advent of Code Day 1
// # https://adventofcode.com/2025/day/1

const solution_html = document.getElementById('solution');

function run(input_str) {
    let position = 50;
    let rotation_to_0 = 0;
    let click_on_0 = 0;
    let rotations = input_str.match(/[L|R]\d+.*/g);

    for(let rotation of rotations) {
        let direction = (rotation[0]=="L") ? -1 : 1;
        let rotations = parseInt(rotation.slice(1));

        // each individual click
        for(let p=0; p < rotations; p++) {
            position += direction;
            if(position < 0) position += 100;
            if(position > 99) position -= 100;
            click_on_0 += position == 0;
        }
        rotation_to_0 += position == 0;
    }
    
    return {rotation_to_0, click_on_0}
}
