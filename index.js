window.addEventListener('load', _event => {
    const mainCanvas = document.querySelector('#mainCanvas');
    mainCanvas.setAttribute('width', mainCanvas.clientWidth);
    mainCanvas.setAttribute('height', mainCanvas.clientHeight);
    const context = mainCanvas.getContext('webgl');
    if (context === null) {
        alert('You need a WebGL enabled browser.');
        return;
    }

    // Enable depth testing
    context.enable(context.DEPTH_TEST);

    // Make near things obscure far things
    context.depthFunc(context.LEQUAL);

    // Program the GLSL vertex shared for transforming vertex coordinates to the OpenGL clip space
    const vertexShaderSource = `
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
    `;

    const vertexShader = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(vertexShader, vertexShaderSource);
    context.compileShader(vertexShader);
    if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
        alert('Failed to compile the vertex shader.\n' + context.getShaderInfoLog(vertexShader));
        context.deleteShader(vertexShader);
        return;
    }

    // Program the fragment shader, in this case returning white color for every pixel of scene objects
    const fragmentShaderSource = `
// Note that this gets passed in from the vertex shader
varying lowp vec4 color;
void main() {
    // This variable is a special "output" global variable of the fragment shader
    gl_FragColor = color;
}
    `;

    const fragmentShader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentShaderSource);
    context.compileShader(fragmentShader);
    if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
        alert('Failed to compile the fragment shader.\n' + context.getShaderInfoLog(fragmentShader));
        context.deleteShader(fragmentShader);
        return;
    }

    // Create a shader program, which is a pair of a vertex and a fragment shader
    const shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);
    if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
        alert('Failed to link the shader program.\n' + context.getProgramInfoLog(shaderProgram));
        return;
    }

    // Set up a matrix for a fake perspective camera
    const fieldOfView = 45 /* degress */ * Math.PI / 180 /* radians */;
    const aspectRatio = mainCanvas.clientWidth / mainCanvas.clientHeight;
    const nearDepth = 0.1;
    const farDepth = 100;
    const projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, nearDepth, farDepth);

    const modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);

    let timestampLast = 0;
    window.requestAnimationFrame(function draw(timestamp) {
        // Set the clear color, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
        context.clearColor(0, 0, 0, 1);
        // Set the clear depth, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
        context.clearDepth(1);
        // Clear the color and depth buffers, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

        // Use the shader program when rendering and feed it the prepared inputs
        context.useProgram(shaderProgram);

        const positionBuffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([ -1, 1 /* LT */, 1, 1 /* RT */, -1, -1 /* LB */, 1, -1 /* RB */ ]), context.STATIC_DRAW);
        context.vertexAttribPointer(context.getAttribLocation(shaderProgram, 'vertexPosition'), 2, context.FLOAT, false, 0, 0);
        context.enableVertexAttribArray(context.getAttribLocation(shaderProgram, 'vertexPosition'));

        const colorBuffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, colorBuffer);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([ 1, 1, 1, 1 /* W */, 1, 0, 0, 1 /* R */, 0, 1, 0, 1 /* G */, 0, 0, 1, 1 /* B */ ]), context.STATIC_DRAW);
        context.vertexAttribPointer(context.getAttribLocation(shaderProgram, 'vertexColor'), 4, context.FLOAT, false, 0, 0);
        context.enableVertexAttribArray(context.getAttribLocation(shaderProgram, 'vertexColor'));

        context.uniformMatrix4fv(context.getUniformLocation(shaderProgram, 'projectionMatrix'), false, projectionMatrix);
        context.uniformMatrix4fv(context.getUniformLocation(shaderProgram, 'modelViewMatrix'), false, modelViewMatrix);

        // Render the scene
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);

        // Rotate the square
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, 0.01, [0 /* X */, 0 /* Y */, 1 /* Z */]);

        document.title = Math.round(1000 / (timestamp - timestampLast)) + ' FPS';
        timestampLast = timestamp;

        window.requestAnimationFrame(draw);
    });
});
