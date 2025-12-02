// # Advent of Code Day 2
// # https://adventofcode.com/2025/day/2

const solution_html = document.getElementById('solution');

function run(input_str) {
    // def day2(input_str:str, part=1):
    //     id_ranges = input_str.split(',')
    //     invalid = []
    //     for r in id_ranges:
    //         parts = r.split('-')
    //         low = int(parts[0])
    //         high = int(parts[1])
    //         for i in range(low, high+1):
    //             num = str(i)
                
    //             # For the first part we can just split the number string in half and check if they match
    //             # i.e 12341234 -> 1234 1234 -> match
    //             if part == 1:
    //                 mid = int(len(num)/2)
    //                 if num[:mid] == num[mid:]:
    //                     invalid.append(i)
    //                     continue

    //             # For the second part we need to check if any group of numbers is repeated at least twice
    //             # i.e 121212 -> 12 12 12 -> match

    //             # Quick check to see if every digit matches
    //             if len(set(list(num))) == 1:
    //                 invalid.append(i)
    //                 continue

    //             # Otherwise, brute force it lol
    //             for div in range(len(num)):
    //                 sub_parts = []
    //                 for p in range(len(num)):
    //                     start = p*div
    //                     end = div+p*div
    //                     sub_part = num[start:end]
    //                     if sub_part:
    //                         sub_parts.append(sub_part)
    //                 if len(set(sub_parts)) == 1:
    //                     invalid.append(i)
    //                     break
    //     return invalid
}
