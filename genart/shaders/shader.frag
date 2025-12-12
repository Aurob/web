precision mediump float;

uniform vec3 myColor;

void main() {
  // the color we have passed in as a uniform is assigned to the pixel
  gl_FragColor = vec4(myColor, 1.0);
}