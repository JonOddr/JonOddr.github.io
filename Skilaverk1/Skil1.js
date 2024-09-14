/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun á "mousedown" og "mousemove" atburðum
//
//    Hjálmtýr Hafsteinsson, september 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var gunCenter = 0.0;
var numShots = 5;
var shotSpeed = 0.01;
var activeShots = [];
var vertices;

var points = 1;
const maxPoints = 5;

for (let i = 0; i < numShots; i++) {
    activeShots.push(false);
}

var mouseX;             // Old value of x-coordinate  
var movement = false;   // Do we move the paddle?

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var gun = [
        vec2(0.0, -0.85),
        vec2(-0.11, -0.95),
        vec2(0.11, -0.95)
    ];

    var shot = [
        vec2(-0.01, -0.91),
        vec2(0.01, -0.91),
        vec2(0.01, -0.89),
        vec2(-0.01, -0.89),
    ];

    var bird = [
        vec2(0.05, 0.8),
        vec2(-0.05, 0.8),
        vec2(-0.05, 0.7),
        vec2(0.05, 0.7)
    ];

    var point = [
        vec2(-0.99, 0.99),
        vec2(-0.97, 0.99),
        vec2(-0.97, 0.89),
        vec2(-0.99, 0.89),
    ];

    vertices = [].concat(gun);
    for (let i = 0; i < numShots; i++) {
        let shotcopy = JSON.parse(JSON.stringify(shot));
        vertices = vertices.concat(shotcopy);
    }
    for (let i = 0; i < maxPoints; i++) {
        let pointcopy = JSON.parse(JSON.stringify(point));
        for (let j = 0; j < 4; j++) {
            pointcopy[j][0] += 0.04*i;
        }
        vertices = vertices.concat(pointcopy);
    }

    vertices = vertices.concat(bird);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        mouseX = e.offsetX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2*(e.offsetX - mouseX)/canvas.width;
            gunCenter += xmove;
            mouseX = e.offsetX;
            for(i=0; i<3; i++) {
                vertices[i][0] += xmove;
            }
            for (i = 0; i < numShots; i++) {
                if (activeShots[i] === false) {
                    for (j = 0; j < 4; j++) {
                        vertices[3 + i * 4 + j][0] += xmove;
                    }
                }
            }
            
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
        }
    } );

    window.addEventListener("keydown", function(e){
        if (e.code === "Space") {
            for (let i = 0; i < activeShots.length; i++) {
                if (!activeShots[i]) {
                    activeShots[i] = true;
                    // activate shot i
                    console.log("SHOOT");
                    break;
                }
            }
        }
    } );

    render();
}

function resetShot(x) {
    activeShots[x] = false;
    vertices[3 + x * 4] = vec2(gunCenter-0.01, -0.91);
    vertices[4 + x * 4] = vec2(gunCenter+0.01, -0.91);
    vertices[5 + x * 4] = vec2(gunCenter+0.01, -0.89);
    vertices[6 + x * 4] = vec2(gunCenter-0.01, -0.89);
}

function checkHit(x, y) {
    // check if shot x hits bird y
    // reset both and add point to score
}

function render() {
    // Láta skot fljúga
    for (let i = 0; i < numShots; i++) {
        if (activeShots[i] === true) {
            for (let j = 0; j < 4; j++) {
                vertices[3 + i * 4 + j][1] += shotSpeed;
            }
            // reset shot if out
            if (vertices[3 + i * 4 + 2][1] > 1.0) resetShot(i);
            // lord haf mercy
            // vec2(gunCenter+0.01, -0.89);
            // vec2(gunCenter-0.01, -0.91);
            // vec2(gunCenter+0.01, -0.91);
            // vec2(gunCenter-0.01, -0.89);
            // vertices[5 + i * 4] = 
            // vertices[3 + i * 4] = 
            // vertices[4 + i * 4] = 
            // vertices[6 + i * 4] = 
        }
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
    
    // Teikna byssu
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);

    // Teikna skot
    for (let i = 0; i < numShots; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 3 + i * 4, 4);
    }
    // Teikna stig
    for (let i = 0; i < points; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 3 + 4 * numShots + i * 4 , 4);
    }
    // Teikna fugla
    gl.drawArrays(gl.TRIANGLE_FAN, 3 + 4 * (numShots + maxPoints), 4)

    window.requestAnimFrame(render);
}
