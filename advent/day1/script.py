# Advent of Code Day 1
# https://adventofcode.com/2025/day/1

input_file = ""
with open("input.txt", "r") as f:
    input_file = f.read().split('\n')
    
# For testing
input_file = '''L68
L30
R48
L5
R60
L55
L1
L99
R14
L82'''.split('\n')

position = 50
zero_states = 0
zero_clicks = 0

for state in input_file:
    direction = -1 if state[0] == 'L' else 1
    clicks = int(state[1:])

    for click in range(clicks):
        position += direction
        if position == 100:
            position = 0
        if position == -1:
            position = 99
        
        if position == 0:
            zero_clicks += 1

    if position == 0:
        zero_states += 1

print(zero_states, zero_clicks)