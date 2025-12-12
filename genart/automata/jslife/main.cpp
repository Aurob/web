#include <emscripten.h>
#include <SDL2/SDL.h>
#include <unordered_map>
#include <unistd.h>
#include <vector>

#include "JSUtils.hpp"

using namespace std;

extern int width, height;
extern float deltaTime;
extern int GameState;
extern vector<bool> cells;
extern int cellSize;
extern int cellCount;
extern int cellCountX;

int width = 2048;
int height = 1024;

int GameState = -1;

float deltaTime = 0;
int lastTime = 0;
int frameTime = 0;

SDL_Rect rect{(width/2) - 12, (height/2) - 12, 25, 25};

int seed;
vector <bool> cells{};
int cellSize = 1; // Default value, previously width/256
int cellCount = 1; // Default value, previously (width/cellSize) * (height/cellSize)
int cellCountX = 1; // Default value, previously width/cellSize

bool defaultRender = true;

struct context
{
    SDL_Event event;
    int iteration;
    SDL_Renderer *renderer;
};

void mainloop(void *arg);
void EventHandler(int, SDL_Event *);
void animations(context *ctx);
void loadCells();
int cellNeighbors(int x, int y);
void updateCells();

int main(int argc, char *argv[])
{

    printf("Loading Life...\n");
    seed = time(NULL);
    srand(seed);
    printf("Seed: %d\n", seed);

    // Initialize the Game object
    SDL_Init(SDL_INIT_VIDEO);

    context ctx;
    GameState = -1;

    SDL_Renderer *renderer;
    SDL_Window *window;

    SDL_CreateWindowAndRenderer(width, height, 0, &window, &renderer);
    
    // Allows opacity
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);

    ctx.iteration = 0;
    ctx.renderer = renderer;

    // SDL_SetRenderDrawColor(renderer, 100, 100, 100, 255);
    // SDL_RenderClear(renderer);

    // Load life cells
    // loadCells();

    emscripten_set_main_loop_arg(mainloop, &ctx, 0, 1);
    emscripten_set_main_loop_timing(EM_TIMING_RAF, 1);

    SDL_DestroyRenderer(ctx.renderer);
    SDL_DestroyWindow(window);

    SDL_Quit();

    return EXIT_SUCCESS;
}

void mainloop(void *arg)
{

    context *ctx = static_cast<context *>(arg);
    
    while (SDL_PollEvent(&ctx->event))
    {
        EventHandler(0, &ctx->event);
    }

    if(GameState == 1) {
        
        // don't animate the first frame
        if(cells.size() == 0) {
            loadCells();
        }
        animations(ctx);
        updateCells();
    }

    ctx->iteration++;
    
    usleep(50000);
}


unordered_map<SDL_Keycode, bool> keys;
void EventHandler(int type, SDL_Event *event)
{
    switch (event->type)
    {

    case SDL_KEYDOWN:
        switch (event->key.keysym.sym)
        {
        case SDLK_ESCAPE:
            break;
        }
        break;
    }
    
    // CTRL + L -> Print Gamestate
    if (event->key.keysym.sym == SDLK_l && SDL_GetModState() & KMOD_CTRL)
    {
        printf("Gamestate: %d\n", GameState);
    }
    // CTRL + O -> disable default render
    if (event->key.keysym.sym == SDLK_o && SDL_GetModState() & KMOD_CTRL)
    {
        defaultRender = false;
    }
    // CTRL + P -> enable default render
    if (event->key.keysym.sym == SDLK_p && SDL_GetModState() & KMOD_CTRL)
    {
        defaultRender = true;
    }
}

void animations(context *ctx)
{

    SDL_SetRenderDrawColor(ctx->renderer, 255, 255, 255, 255);

    int _cellSize = 10;
    for (int i = 0; i < cellCount; i++)
    {
        SDL_Rect cellRect{(i % cellCountX) * _cellSize, (i / cellCountX) * _cellSize, _cellSize, _cellSize};
        bool cellIsAlive = cells[i];
        int neighbors = cellNeighbors(i % cellCount, i / cellCount);
        // bool shouldRender = (cellIsAlive && defaultRender) || (!cellIsAlive && !defaultRender && (neighbors < 1));
        
        // if (shouldRender)
        // {
        if(cellIsAlive) {
            SDL_SetRenderDrawColor(ctx->renderer, 0, 0, 0, 255);
        } else {
            SDL_SetRenderDrawColor(ctx->renderer, 255, 255, 255, 255);
        }
        SDL_RenderFillRect(ctx->renderer, &cellRect);
        // }
    }

    SDL_RenderPresent(ctx->renderer);

}

int cellNeighbors(int x, int y)
{
    int neighbors = 0;
    for (int i = x - 1; i <= x + 1; i++)
    {
        for (int j = y - 1; j <= y + 1; j++)
        {
            if (i == x && j == y) continue; // Skip the cell itself
            if (i < 0 || i >= width/cellSize || j < 0 || j >= height/cellSize) continue; // Skip out of bounds cells
            if (cells[(j * (width/cellSize)) + i]) neighbors++;

        }
    }
    return neighbors;
}

void loadCells()
{
    for (int i = 0; i < cellCount; i++)
    {
        cells.push_back((rand() % 200) < 16);
    }
}

void updateCells()
{
    // Default algorithm
    for (int i = 0; i < cellCount; i++)
    {
        int neighbors = cellNeighbors(i % (width), i / (width));

        if (cells[i])
        {
            if (neighbors < 2 || neighbors > 3)
            {
                cells[i] = false;
            }
        }
        else
        {
            if (neighbors == 3)
            {
                cells[i] = true;
            }
        }

    }    
}