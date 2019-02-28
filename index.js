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

    const _2dVertexShaderSource = await (await fetch('shaders/2d.glsl')).text();
    const _3dVertexShaderSource = await (await fetch('shaders/3d.glsl')).text();
    const blueColorFragmentShaderSource = await (await fetch('shaders/blueColor.glsl')).text();
    const vertexColorFragmentShaderSource = await (await fetch('shaders/vertexColor.glsl')).text();

    let timestampLast = 0;
    window.requestAnimationFrame(function draw(timestamp) {
        // Set the clear color, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
        context.clearColor(0, 0, 0, 1);
        // Set the clear depth, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
        context.clearDepth(1);
        // Clear the color and depth buffers, https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

        const cubeProgram = setProgram(context, _3dVertexShaderSource, vertexColorFragmentShaderSource);
        drawCube(context, cubeProgram, projectionMatrix, cube1ModelViewMatrix);
        drawCube(context, cubeProgram, projectionMatrix, cube2ModelViewMatrix);

        const lineProgram = setProgram(context, _2dVertexShaderSource, blueColorFragmentShaderSource);
        draw2dLine(context, lineProgram, getCirclePoints(0, 0, .15, 6));
        draw2dLine(context, lineProgram, getCirclePoints(Math.sin(timestamp / 1000) / 2, Math.cos(timestamp / 1000) / 2, Math.abs(Math.tan(timestamp / 1000) / 100), 60));

        // Rotate the cubes
        glMatrix.mat4.rotate(cube1ModelViewMatrix, cube1ModelViewMatrix, 0.01, [1 /* X */, 1 /* Y */, 1 /* Z */]);
        glMatrix.mat4.rotate(cube2ModelViewMatrix, cube2ModelViewMatrix, 0.01, [-1 /* X */, -1 /* Y */, -1 /* Z */]);

        document.title = Math.round(1000 / (timestamp - timestampLast)) + ' FPS';
        timestampLast = timestamp;

        window.requestAnimationFrame(draw);
    });
});

function setProgram(context, vertexShaderSource, fragmentShaderSource) {
    // Download and compile a vertex shader
    const vertexShader = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(vertexShader, vertexShaderSource);
    context.compileShader(vertexShader);
    if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
        console.log(context.getShaderInfoLog(vertexShader));
        alert(`Failed to compile the vertex shader.\n\n${vertexShaderSource}`);
        context.deleteShader(vertexShader);
        return;
    }

    // Download and compile a fragment shader
    const fragmentShader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentShaderSource);
    context.compileShader(fragmentShader);
    if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
        console.log(context.getShaderInfoLog(fragmentShader));
        alert(`Failed to compile the fragment shader.\n\n${fragmentShaderSource}`);
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
        context.deleteProgram(shaderProgram);
        return;
    }

    // Use the shader program when rendering and feed it the prepared inputs
    context.useProgram(shaderProgram);
    return shaderProgram;
}

function drawCube(context, shaderProgram, projectionMatrix, modelViewMatrix) {
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

function draw2dLine(context, shaderProgram, positionBufferData) {    
    const positionBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
    context.bufferData(context.ARRAY_BUFFER, positionBufferData, context.STATIC_DRAW);
    context.vertexAttribPointer(context.getAttribLocation(shaderProgram, 'position'), 2, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(context.getAttribLocation(shaderProgram, 'position'));
    context.drawArrays(context.LINE_LOOP, 0, positionBufferData.length / 2);
}

function getCirclePoints(centerX, centerY, radius, count) {
    const bufferData = new Float32Array(count * 2);
    for (let index = 0; index < count; index++) {
        const angle = ((index / count) * 360) * Math.PI / 180;
        bufferData[index * 2 + 0] = centerX + radius * Math.sin(angle);
        bufferData[index * 2 + 1] = centerY + radius * Math.cos(angle);
    }
    
    return bufferData;
}

function drawSphere() {
    // TODO: Generate a polyline of a spiral encompassing a sphere
    // TODO: Remember to read 3 components from the buffer for XYZ
    // TODO: Use or adapt the 3D vertex shader for the 3D line vertex positions
}
