var canvas;
var gl;

var maxNumCircles = 200;
var pointsInCircle = 22;
var index = 0;
var points = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL isn't available");}
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 1.0, 1.0, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*pointsInCircle*maxNumCircles, gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousedown", function(e){

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        
        // Calculate center of new circle
        var center = vec2(2*e.offsetX/canvas.width-1, 2*(canvas.height-e.offsetY)/canvas.height-1);
        var radius  = Math.random()*0.25;

        createCirclePoints(center, radius, 20);

        // Add new circle behind the others
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*pointsInCircle*index, flatten(points));
        index++;
        render();
    } );

    render();
}

// Create the points of the circle
function createCirclePoints( cent, rad, k )
{
    points = [];
    points.push(cent);
    
    var dAngle = 2*Math.PI/k;
    for( i=k; i>=0; i-- ) {
    	a = i*dAngle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	points.push(p);
    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    for (i=0; i<index; i++) {
        gl.drawArrays( gl.TRIANGLE_FAN, i*pointsInCircle, pointsInCircle);
    }
    // window.requestAnimFrame(render);
}