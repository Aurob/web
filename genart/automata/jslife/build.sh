#!/bin/bash
echo "compile commenced at:" $(date)
start_time=$(date +%s)
  em++ -std=c++1z $1.cpp \
  -s WASM=1 -s USE_SDL=2 -s USE_WEBGL2=1\
  -lSDL\
  -s USE_BOOST_HEADERS=1\
  -s STB_IMAGE=1\
  -s SDL2_IMAGE_FORMATS="['png']"\
  -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']"\
  -s EXPORTED_FUNCTIONS="['_main', '_load_json', _malloc, UTF8ToString, stringToUTF8]"\
  --use-preload-plugins\
  -s ALLOW_MEMORY_GROWTH=1 \
  -o $1.js\
  -s NO_DISABLE_EXCEPTION_CATCHING\

end_time=$(date +%s)
echo "compile finished at:" $(date)
echo "compile time:" $(($end_time - $start_time)) "seconds"