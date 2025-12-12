#!/bin/bash

echo "compile commenced at:" $(date)
  em++ -std=c++1z dev/src/$1.cpp\
  -s WASM=1 -s USE_SDL=2 -O1 \
  --profiling\
  -s EXPORTED_FUNCTIONS="['_main']" \
  -s EXPORTED_RUNTIME_METHODS=["cwrap"] \
  -s USE_SDL_IMAGE=2\
  -s ALLOW_MEMORY_GROWTH=1 --use-preload-plugins\
  -s SDL2_IMAGE_FORMATS='["png"]'\
  -s USE_SDL_TTF=2\
  -lSDL \
  -o $1.js\
  -s ASSERTIONS=1\
  -s LLD_REPORT_UNDEFINED