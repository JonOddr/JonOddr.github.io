/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Jörð og Mars snúast um sólina (allt teningar!)
//
//     Hér er teningurinn skilgreindur með hnútum og hliðum.
//     Það þýðir að litir eru fastir við einstaka hnúta, ekki
//     hliðar.
//
//    Hjálmtýr Hafsteinsson, september 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 36;

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -2.0;

var proLoc;
var mvLoc;

var running = true;

// Getum stillt fjölda kassa á hvern ás
var numCubesY = 10;
var numCubesX = 10;
var numCubesZ = 10;

// Líkur á að kassi byrji lifandi
var chanceOfBox = 0.25;

// Notað til að halda utan um hversu langt er síðan við uppfærðum stöðu leiksins
var framesSinceLastUpdate = 0;

// the 8 vertices of the cube
var vertices = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 )   // white
];

// indices of the 12 triangles that compise the cube
var indices = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7,
    7, 6, 2,
    3, 0, 4,
    4, 7, 3,
    6, 5, 1,
    1, 2, 6,
    4, 5, 6,
    6, 7, 4,
    5, 4, 0,
    0, 1, 5
];

// Búum til fylki sem halda utan um stærð og stöðu kassa
var prevLive;
var sizes = new Array(numCubesX);
var livingBoxes = new Array(numCubesX);
for (let i = 0; i < numCubesX; i++) {
    livingBoxes[i] = new Array(numCubesY);
    sizes[i] = new Array(numCubesY);
    for (let j = 0; j < numCubesY; j++) {
        livingBoxes[i][j] = new Array(numCubesZ);
        sizes[i][j] = new Array(numCubesZ);
        for (let k = 0; k < numCubesZ; k++) {
            if (chanceOfBox > Math.random()) {
                livingBoxes[i][j][k] = true;
                sizes[i][j][k] = 1.0;
            } else {
                livingBoxes[i][j][k] = false;
                sizes[i][j][k] = 0.0;
            }
        }
    }
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // array element buffer
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    
    // color array attribute buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // vertex array attribute buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));
    
    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
            case 32:
                running = !running;
         }
     }  );  

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  

    render();
}

function checkBox(x, y, z) {
    // telur líka kassan sem við erum að skoða, þarf þess vegna að byrja sem -1
    var liveNeighbours = -1;
    if (!prevLive[x][y][z]) liveNeighbours = 0;
    var a = x-1; var b = y-1; var c = z-1;
    var i = 3; var j = 3; var k = 3;
    if (x === 0 || x === numCubesX-1) i = 2;
    if (x === 0) a++;
    if (y === 0 || y === numCubesY-1) j = 2;
    if (y === 0) b++;
    if (z === 0 || z === numCubesZ-1) k = 2;
    if (z === 0) c++;
    for (let d = a; d < a+i; d++) {
        for (let e = b; e < b+j; e++) {
            for (let f = c; f < c+k; f++) {
                if (prevLive[d][e][f]) liveNeighbours++;
            }
        }
    }    
    if (prevLive[x][y][z] && liveNeighbours <= 7 && liveNeighbours >= 5) {
        return true;
    } else if (liveNeighbours === 6) {
        return true;
    } else {
        return false;
    }
}

function gameTick() {
    prevLive = JSON.parse(JSON.stringify(livingBoxes));
    for (let i = 0; i < numCubesX; i++) {
        for (let j = 0; j < numCubesY; j++) {
            for (let k = 0; k < numCubesZ; k++) {
                livingBoxes[i][j][k] = checkBox(i,j,k);
            }
        }
    }
}

function render() {
    if (framesSinceLastUpdate === 180) {
        framesSinceLastUpdate = 0;
        if (running) gameTick();
    }

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Skilgreina hlaða fyrir vörpunarfylki
    var mvstack = [];
    
    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );

    // skoðum alla kassana
    for (var i = 0; i < numCubesX; i++) {
        for (var j = 0; j < numCubesY; j++) {
            for (var k = 0; k < numCubesZ; k++) {
                // athugum hvort við þurfum að uppfæra stærð kassans
                if (running) {
                    if (!livingBoxes[i][j][k] && (sizes[i][j][k] > 0.0)) {
                        sizes[i][j][k] -= 0.02;
                    }
                    if (livingBoxes[i][j][k] && (sizes[i][j][k] < 1.0)) {
                        sizes[i][j][k] += 0.02;
                    }
                }
                var size = sizes[i][j][k];
                // Ef stærð kassa er hærri en 0, teiknum við hann.
                if (size > 0.0) {
                    // hliðrunar töfrar
                    mvstack.push(mv);
                    var a = 1-(((numCubesX+1)/2)/numCubesX)-(1.0/numCubesX)*i;
                    var b = 1-(((numCubesY+1)/2)/numCubesY)-(1.0/numCubesY)*j;
                    var c = 1-(((numCubesY+1)/2)/numCubesY)-(1.0/numCubesZ)*k;
                    mv = mult(mv, translate(a, b, c));
                    
                    mvstack.push(mv);
                    // skölum stærð kassans eftir, jú, stærð kassans.
                    mv = mult( mv, scalem(0.85*size/numCubesX, 0.85*size/numCubesY, 0.85*size/numCubesZ));
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
                    gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0);
                    mv = mvstack.pop();
                    
                    mv = mvstack.pop();   
                }
            }
        }
    }
    if (running) framesSinceLastUpdate += 1;
    requestAnimFrame( render );
}

