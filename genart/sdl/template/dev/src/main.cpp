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

void mainloop(void *arg);
void SDLCALL EventHandler(void *userdata, SDL_Event *event);

void test_draw(SDL_Renderer *renderer)
{
    SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);

    // Red Square Rect in the middle
    SDL_Rect rect;
    rect.x = WIDTH / 2 - 25;
    rect.y = HEIGHT / 2 - 25;
    rect.w = 50;
    rect.h = 50;
    SDL_SetRenderDrawColor(renderer, 255, 255, 0, 255);
    SDL_RenderFillRect(renderer, &rect);
}

int main(int argc, char *argv[])
{
    printf("Hello, world!\n");
    srand(time(NULL));

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

void mainloop(void *arg)
{

    context *ctx = static_cast<context *>(arg);
    SDL_Renderer *renderer = ctx->renderer;

    // Clear the screen
    SDL_SetRenderDrawColor(renderer, 10, 0, 0, 255);
    SDL_RenderClear(renderer);

    while (SDL_PollEvent(&ctx->event))
    {
        EventHandler(0, &ctx->event);
    }

    // Draw things here
    test_draw(renderer);

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
