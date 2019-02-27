window.addEventListener('load', async _event => {
    const mainCanvas = document.querySelector('#mainCanvas');
    
    // Set the canvas image dimensions (default 300x150) to the dimensions of the `canvas` DOM element to avoid it needing to be scaled
    mainCanvas.setAttribute('width', mainCanvas.clientWidth);
    mainCanvas.setAttribute('height', mainCanvas.clientHeight);
    
    // Obtain the WebGL rendering context after the canvas image dimensions have been set up
    const context = mainCanvas.getContext('webgl');
    if (context === null) {
        alert('Failed to obtain a WebGL rendering context.');
        return;
    }

    // Enable the use of the depth buffer and comparing to it for depth testing using the `depthFunc`
    context.enable(context.DEPTH_TEST);

    // Make near things obscure far things by passing if the incoming value is less than or equal to the depth buffer value
    context.depthFunc(context.LEQUAL);

    // Download and compile a vertex shader
    const vertexShaderRequest = await fetch('shaders/vertex.glsl');
    const vertexShaderSource = await vertexShaderRequest.text();
    const vertexShader = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(vertexShader, vertexShaderSource);
    context.compileShader(vertexShader);
    if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
        alert('Failed to compile the vertex shader.\n' + context.getShaderInfoLog(vertexShader));
        context.deleteShader(vertexShader);
        return;
    }

    // Download and compile a fragment shader
    const fragmentShaderRequest = await fetch('shaders/fragment.glsl');
    const fragmentShaderSource = await fragmentShaderRequest.text();
    const fragmentShader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentShaderSource);
    context.compileShader(fragmentShader);
    if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
        alert('Failed to compile the fragment shader.\n' + context.getShaderInfoLog(fragmentShader));
        context.deleteShader(fragmentShader);
        return;
    }

    // Create and link a shader program, which is a pair of a vertex and a fragment shader
    const shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);
    if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
        alert('Failed to link the shader program.\n' + context.getProgramInfoLog(shaderProgram));
        return;
    }

    const fieldOfViewRadians = 45 * Math.PI / 180;
    const aspectRatio = mainCanvas.clientWidth / mainCanvas.clientHeight;

    // Note that near depth which is too small will result into faces bleeding into one another
    const nearDepth = 1;
    const farDepth = Number.POSITIVE_INFINITY;

    const projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, fieldOfViewRadians, aspectRatio, nearDepth, farDepth);

    const cube1ModelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(cube1ModelViewMatrix, cube1ModelViewMatrix, [-1, 0, -6]);

    const cube2ModelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(cube2ModelViewMatrix, cube2ModelViewMatrix, [1, 0, -6]);

    let timestampLast = 0;
    window.requestAnimationFrame(function draw(timestamp) {
        // Set the clear color, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
        context.clearColor(0, 0, 0, 1);
        // Set the clear depth, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
        context.clearDepth(1);
        // Clear the color and depth buffers, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

        // Draw the cubes
        drawCube(context, shaderProgram, projectionMatrix, cube1ModelViewMatrix);
        drawCube(context, shaderProgram, projectionMatrix, cube2ModelViewMatrix);

        // Rotate the cubes
        glMatrix.mat4.rotate(cube1ModelViewMatrix, cube1ModelViewMatrix, 0.01, [1 /* X */, 1 /* Y */, 1 /* Z */]);
        glMatrix.mat4.rotate(cube2ModelViewMatrix, cube2ModelViewMatrix, 0.01, [-1 /* X */, -1 /* Y */, -1 /* Z */]);

        document.title = Math.round(1000 / (timestamp - timestampLast)) + ' FPS';
        timestampLast = timestamp;

        window.requestAnimationFrame(draw);
    });
});

function drawCube(context, shaderProgram, projectionMatrix, modelViewMatrix) {
    // Use the shader program when rendering and feed it the prepared inputs
    context.useProgram(shaderProgram);
    
    context.uniformMatrix4fv(context.getUniformLocation(shaderProgram, 'projectionMatrix'), false, projectionMatrix);
    context.uniformMatrix4fv(context.getUniformLocation(shaderProgram, 'modelViewMatrix'), false, modelViewMatrix);

    const positionBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, // Front face XYZ x4
        -1, -1, -1, -1, 1, -1, 1,  1, -1, 1, -1, -1, // Back face XYZ x4
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, // Top face XYZ x4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, // Bottom face XYZ x4
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,// Right face XYZ x4
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, // Left face XYZ x4
    ]), context.STATIC_DRAW);
    context.vertexAttribPointer(context.getAttribLocation(shaderProgram, 'vertexPosition'), 3, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(context.getAttribLocation(shaderProgram, 'vertexPosition'));

    const colorBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, colorBuffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // Front face RGBA x4
        1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, // Back face RGBA x4
        0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, // Top face RGBW x4
        0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, // Bottom face RGBW x4
        1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, // Right face RGBW x4
        1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, // Left face RGBW x4
    ]), context.STATIC_DRAW);
    context.vertexAttribPointer(context.getAttribLocation(shaderProgram, 'vertexColor'), 4, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(context.getAttribLocation(shaderProgram, 'vertexColor'));

    const indexBuffer = context.createBuffer();
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
    context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array([
        0,  1,  2,      0,  2,  3,    // Front face tri indices
        4,  5,  6,      4,  6,  7,    // Back face tri indices
        8,  9,  10,     8,  10, 11,   // Top face tri indices
        12, 13, 14,     12, 14, 15,   // Bottom face tri indices
        16, 17, 18,     16, 18, 19,   // Right face tri indices
        20, 21, 22,     20, 22, 23,   // Left face tri indices
    ]), context.STATIC_DRAW);
    
    context.drawElements(context.TRIANGLES, 36, context.UNSIGNED_SHORT, 0);
}
