#!/bin/bash
echo "Starting compile at:" $(date)
if [ $1 = "new2" ] 
then
  emcc -std=c++1z $1.cpp FastNoise.cpp -s WASM=1 -s USE_SDL=2 -O3 -o $1.js \
  -s EXPORTED_FUNCTIONS="['_main', '_get_info', '_ecount']" \
  -s EXTRA_EXPORTED_RUNTIME_METHODS=["cwrap"] \
  -s USE_SDL_IMAGE=2\
  -s ALLOW_MEMORY_GROWTH=1 --use-preload-plugins\
  -s SDL2_IMAGE_FORMATS='["bmp","png"]'\
  -lSDL --preload-file Resources
elif [ $1 = "newtest" ] 
then
  emcc -std=c++1z $1.cpp -s WASM=1 -s USE_SDL=2 -O3 -o $1.js \
  -s EXPORTED_FUNCTIONS="['_main', '_update_chunks', '_clear_chunks', '_get_pos']" \
  -s EXTRA_EXPORTED_RUNTIME_METHODS=["cwrap"] \
  -lSDL --preload-file Resources -s USE_SDL_IMAGE=2 -s ALLOW_MEMORY_GROWTH=1\
  --use-preload-plugins -s SDL2_IMAGE_FORMATS='["bmp","png"]'
elif [ $1 = "walk" ] 
then
  emcc -std=c++1z $1.cpp FastNoise.cpp -s WASM=1 -s USE_SDL=2 -O3 -o $1.js \
  -s EXPORTED_FUNCTIONS="['_main']" \
  -s EXTRA_EXPORTED_RUNTIME_METHODS=["cwrap"]
else
  echo "NO!"
fi
