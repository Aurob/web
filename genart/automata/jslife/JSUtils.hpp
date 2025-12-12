#pragma once
#include <emscripten.h>
#include "json.hpp"
#include <map>
#include <vector>
#include <functional>
#include <iostream>
#include <sstream>

using namespace std;

extern int width, height;
extern int GameState;
extern std::vector<bool> cells;
extern int cellSize;
extern int cellCount;
extern int cellCountX;

void _js__kvdata_i(int k, int v)
{
    // Send an integer to JS
    EM_ASM_({
        Module.setkv($0, $1);
    }, k, v);
}

void _js__kvdata_f(int k, float v)
{
    // Send a float to JS
    EM_ASM_({
        Module.setkv($0, $1);
    }, k, v);
}


nlohmann::json str_to_json(std::string str)
{
    nlohmann::json js_json;
    try
    {
        std::string trimmed_str = str;
        js_json = nlohmann::json::parse(trimmed_str);
    }
    catch (nlohmann::json::parse_error &e)
    {
        printf("JSON parse error: %s\n", e.what());
        printf("str: %s\n", str.c_str());
    }
    return js_json;
}

extern "C"
{
    EMSCRIPTEN_KEEPALIVE
    void load_json(char *str)
    {
        nlohmann::json js_json = str_to_json(str);
        printf("js_json: %s\n", js_json.dump().c_str());
        
        if (js_json.contains("cells") && js_json["cells"].is_array())
        {
            GameState = 1;
            cells = js_json["cells"].get<vector<bool>>();
            width = js_json["width"].get<int>();
            height = js_json["height"].get<int>();
            cellSize = js_json["cell_size"].get<int>();
            cellCount = js_json["cell_count"].get<int>();
            cellCountX = width;
            
        }
        // if 'gs' (GameState) in json
        if (js_json.contains("gs") && js_json["gs"].is_number())
        {
            GameState = js_json["gs"].get<int>();
        }
        
    }
}
