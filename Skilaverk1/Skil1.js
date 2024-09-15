var canvas;
var gl;

const birdHolder = vec2(1.5, 1.5);
const birdWidth = 0.05
const birdHeight = 0.05
const shotSpeed = 0.02;
const numShots = 5;
const maxPoints = 5;
const maxBirds = 5;

var vertices;
var points = 0;
var gunCenter = 0.0;
var activeShots = [];
var activeBirds = [];
var birdSpeeds = [];
var birdCenters = [];
var birdOffsets = [
    vec2(birdHeight, birdWidth),
    vec2(-birdHeight, birdWidth),
    vec2(-birdHeight, -birdWidth),
    vec2(birdHeight, -birdWidth)
];

for (let i = 0; i < numShots; i++) {
    activeShots.push(false);
}

for (let i = 0; i < maxBirds; i++) {
    activeBirds.push(false);
    birdSpeeds.push(vec2(0.0, 0.0));
    birdCenters.push(birdHolder);
}

var mouseX;             // Old value of x-coordinate  
var movement = false;   // Do we move the paddle?

window.onload = function init() {
    points = 0;

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
        vec2(-0.01, -0.89)
    ];

    var bird = [
        birdHolder,
        birdHolder,
        birdHolder,
        birdHolder
    ];

    var point = [
        vec2(-0.99, 0.99),
        vec2(-0.97, 0.99),
        vec2(-0.97, 0.89),
        vec2(-0.99, 0.89)
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

    for (let i = 0; i < maxBirds; i++) {
        let birdcopy = JSON.parse(JSON.stringify(bird));
        vertices = vertices.concat(birdcopy);
    }

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

function resetBird(x) {
    activeBirds[x] = false;
    birdCenters[x] = birdHolder;
    for (let i = 0; i < 4; i++) {
        vertices[3 + i + 4*(maxPoints + numShots) + x * 4] = add(birdCenters[x], birdOffsets[i]);
    }
}

function checkHit(x, y) {
    if (vertices[3 + x * 4][0] < birdCenters[y][0] - birdHeight) return;
    if (vertices[4 + x * 4][0] > birdCenters[y][0] + birdHeight) return;
    if (vertices[4 + x * 4][1] > birdCenters[y][1] + birdWidth) return;
    if (vertices[5 + x * 4][1] < birdCenters[y][1] - birdWidth) return;
    resetBird(y);
    resetShot(x);
    points += 1;
    var container = document.getElementById("scorecount");
    container.innerHTML = "Birds hit: " + points;
    // check if shot x hits bird y
    // reset both and add point to score
}

function spawnBird() {
    for (let i = 0; i < maxBirds; i++) {
        // find inactive bird
        if (!activeBirds[i]) {
            // spawn location
            let y = 0.4+Math.random()*0.5;
            let x = 1.0+birdWidth;
            // x-axis speed
            let xspeed = -1*(0.003+Math.random()*0.007);
            // 50-50 which side
            if (Math.random() < 0.5) {
                x *= -1;
                xspeed *= -1;
            }
            birdSpeeds[i][0] = xspeed;
            birdCenters[i] = vec2(x, y);
            for (let j = 0; j < 4; j++) {
                vertices[3 + j + 4*(maxPoints + numShots) + i * 4] = add(birdCenters[i], birdOffsets[j]);
            }
            activeBirds[i] = true;
            break;
        }
    }
}

function render() {
    // Virkja fugl
    let x = Math.floor(Math.random()*900);
    if (x < 10) spawnBird();
    if (x < 1) spawnBird();
    // Láta fugla fljúga
    for (let i = 0; i < maxBirds; i++) {
        if (activeBirds[i] === true) {
            birdCenters[i][0] += birdSpeeds[i][0];
            for (let j = 0; j < 4; j++) {
                vertices[3 + 4*(maxPoints + numShots) + i * 4 + j][0] += birdSpeeds[i][0];
            }
            // Endurstilla fugla ef þeir fljúga út fyrir
            if (Math.abs(birdCenters[i][0]) > 1.0+birdWidth) resetBird(i);
        }
    }
    // Láta skot fljúga
    for (let i = 0; i < numShots; i++) {
        if (activeShots[i] === true) {
            // move shot
            for (let j = 0; j < 4; j++) {
                vertices[3 + i * 4 + j][1] += shotSpeed;
            }
            // reset shot if out
            if (vertices[3 + i * 4 + 2][1] > 1.0) resetShot(i);
            // check collision with bird
            for (let j = 0; j < maxBirds; j++) {
                if (activeBirds[j]) checkHit(i, j);
            }
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
    for (let i = 0; i < maxBirds; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 3 + 4 * (numShots + maxPoints + i), 4);
    }
    if (points < maxPoints) {
        window.requestAnimFrame(render);
    } else {
        var winnerDiv = document.getElementById("win-msg");
        winnerDiv.innerHTML = "You win!!!";
    }
}
