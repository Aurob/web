#include <emscripten.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <SDL_ttf.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <vector>
#include <map>
#include <SDL_thread.h>
#include "../includes/FastNoise.hpp"

#define WIDTH 1024
#define HEIGHT 768
using namespace std;

// This is a template

struct context
{
    SDL_Renderer *renderer;
    SDL_Event event;
    int iteration;
};

SDL_Rect tex_rect;
SDL_Rect screen_rect;

FastNoise noise;
Uint8 r, g, b, a;
float n;
int offset;

void mainloop(void *arg);
void SDLCALL EventHandler(void *userdata, SDL_Event *event);

int main(int argc, char *argv[])
{
    printf("Hello, world!\n");
    srand(time(NULL));
    offset = rand() % 1000;

    noise.SetFrequency(0.01);
    
    // Initialize the Game object
    TTF_Init();
    SDL_Init(SDL_INIT_VIDEO);
    SDL_Window *window;
    SDL_Renderer *renderer;

    SDL_CreateWindowAndRenderer(WIDTH, HEIGHT, 0, &window, &renderer);

    // Allows opacity
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
    context ctx;
    ctx.renderer = renderer;

    emscripten_set_main_loop_arg(mainloop, &ctx, -1, 1);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();

    return EXIT_SUCCESS;
}

SDL_Color color;
void drawStatic(SDL_Renderer *renderer)
{
    SDL_Rect tile;
    tile.w = 10;
    tile.h = 10;

    for(int i = 0; i < WIDTH; i+=10)
    {
        for(int j = 0; j < HEIGHT; j+=10)
        {
            
            tile.x = i;
            tile.y = j;

            n = noise.GetSimplex(i + offset, j + offset);
            color = {static_cast<Uint8>(rand() % 255), static_cast<Uint8>(rand() % 255), static_cast<Uint8>(rand() % 255), 255};
            color.r *= n;
            color.g *= n;
            color.b *= n;

            SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
            SDL_RenderFillRect(renderer, &tile);
        }
    }
}

void mainloop(void *arg)
{

    context *ctx = static_cast<context *>(arg);
    SDL_Renderer *renderer = ctx->renderer;

    while (SDL_PollEvent(&ctx->event))
    {
        EventHandler(0, &ctx->event);
    }

    // Draw things here
    // test_draw(renderer);
    // drawGrid(32, renderer);

    if(ctx->iteration % 10 == 0) {
        // Clear the screen
        SDL_SetRenderDrawColor(renderer, 10, 0, 0, 255);
        SDL_RenderClear(renderer);
        drawStatic(renderer);
    }

    SDL_RenderPresent(renderer);
    ctx->iteration++;
}

void SDLCALL EventHandler(void *userdata, SDL_Event *event)
{
    switch (event->type)
    {
    case SDL_MOUSEBUTTONDOWN:
        // printf("Event %d\n", event->type);
        break;

    case SDL_MOUSEBUTTONUP:
        // printf("Event %d\n", event->type);
        break;

    case SDL_MOUSEMOTION:
        // printf("Event %d\n", event->type);
        break;

    case SDL_KEYUP:
        // printf("Event %d\n", event->type);
        break;

    case SDL_KEYDOWN:
        // printf("Event %d\n", event->type);
        break;

    case SDL_MOUSEWHEEL:
        // printf("Event %d\n", event->type);
        break;
    default:
        break;
    }
}
