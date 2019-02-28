attribute vec4 vertexPosition;
attribute vec4 vertexColor;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying lowp vec4 color;
void main() {
    // This variable is a special "output" global variable of the vertex shader
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    // Propagate the vertex color to a varying for passing to the fragment shader
    color = vertexColor;
}
