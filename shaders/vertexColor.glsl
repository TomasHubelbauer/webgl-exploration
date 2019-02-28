// Note that this gets passed in from the vertex shader
varying lowp vec4 color;
void main() {
    // This variable is a special "output" global variable of the fragment shader
    gl_FragColor = color;
}
