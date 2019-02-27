# WebGL Exploration

[**DEMO**](https://tomashubelbauer.github.io/webgl-exploration)

In this repository I am going to be reading through and following WebGL tutorial with a goal of putting together a demo
of rendering a low poly scene comprising of procedurally generated objects from scratch and animating a camera flying
through that scene.

This landing page is a stream of consciousness append-mostly log of this exploration. If there is a conclusion to it and
you want to read only that, it will probably be at the very bottom - at some point.

I am going to be following this tutorial from MDN: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL
I don't know if it is good quality or up to date, but I trust MDN a fair bit so I'll start there and see where that takes
me.

To run this demo, open `index.html` in your browser. At some point I will also turn it into a GitHub Pages hosted static
site.

- [ ] Turn this demo into a GitHub Pages hosted static site

The WebGL rendering context documentation can be found here:

https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext

The GLSL language documentation is here:

https://www.khronos.org/files/opengles_shading_language.pdf

WebGL supports vertex and fragment shaders written in GLSL, which get compiler
to a representation which gets sent to the GPU which executes the shares, not
JavaScript or the browser runtime on the CPU.

WebGL clip space axes range from -1 to 1, 0 being the dead center of the canvas
and negative X being the left side, negative Y being the top side.

A vertex shader transforms the 3D coordinates of the vertices to the clip space
coordinates.

The vertex shader can pass data to the fragment shader using what's called
varyings.

https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Data#Varyings

A fragment shader is called once for every pixel in the clip space of the scene.
Similarly to how vertex shaders have a special output variable `gl_Position`,
fragment shaders have once called `gl_FragColor`.

The tutorials call for the use of the glmatrix.js library. I am not too happy
about this as I want to stick with plain JavaScript for this demo, but for now
I'll oblige. I am going to use JSDelivr to obtain the library.

https://github.com/toji/gl-matrix
http://glmatrix.net/
https://www.jsdelivr.com/package/npm/gl-matrix

- [ ] Figure out if `neatDepth` can be zero and if not why not
- [ ] Figure out if `farDepth` can be infinite and if not why not

- [ ] Fix the *Exceeded 16 live WebGL contexts for this principal, losing the least recently used one.* error
  - Do I need to reacreate the context each time or something?

- [ ] Continue with https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL

You can find the live demo at https://tomashubelbauer.github.io/webgl-exploration

- [ ] Check out skybox approaches: https://webglfundamentals.org/webgl/lessons/webgl-skybox.html
- [ ] Check out materials on this HDR sample: http://webglsamples.org/hdr/hdr.html
- [ ] Check WebGLSamples and WebGLFundamentals in general
- [ ] Add more cubes in a formation and rotate them all individually

Install the VS Code extension mentioned in `shaders` to see syntax highlighting
for GLSL in VS Code.
