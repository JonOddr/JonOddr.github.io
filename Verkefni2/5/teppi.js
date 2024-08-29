
var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 0;

var bufferId;

function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
        
    //
    //  Initialize our data for the Sierpinski Gasket
    //

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*Math.pow(6, 7), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
        document.getElementById("slider").onchange = function(event) {
        numTimesToSubdivide = event.target.value;
        render();
    };


    render();
};

function square(a, b, c, d)
{
    points.push(a, b, c);
    points.push(b, c, d);
}

function divideSquare(aa, bb, cc, dd, count)
{

    // check for end of recursion
    
    if ( count == 0 ) {
        square(aa, bb, cc, dd);
    }
    else {
    
        // find points for splitting
        var ab = mix(aa, bb, 1/3);
        var ac = mix(aa, cc, 1/3);
        var ad = mix(aa, dd, 1/3);

        var ba = mix(bb, aa, 1/3);
        var bc = mix(bb, cc, 1/3);
        var bd = mix(bb, dd, 1/3);

        var ca = mix(cc, aa, 1/3);
        var cb = mix(cc, bb, 1/3);
        var cd = mix(cc, dd, 1/3);

        var da = mix(dd, aa, 1/3);
        var db = mix(dd, bb, 1/3);
        var dc = mix(dd, cc, 1/3);

        --count;

        // eight new squares
        
        divideSquare(aa, ab, ac, ad, count);
        divideSquare(ab, ba, ad, bc, count);
        divideSquare(ba, bb, bc, bd, count);
        divideSquare(bc, bd, da, db, count);
        divideSquare(da, db, dc, dd, count);
        divideSquare(cb, da, cd, dc, count);
        divideSquare(ca, cb, cc, cd, count);
        divideSquare(ac, ad, ca, cb, count);
    }
}

window.onload = init;

function render()
{
    var vertices = [
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, -1),
        vec2(1, 1)
    ];
    points = [];
    divideSquare( vertices[0], vertices[1], vertices[2], vertices[3],
                    numTimesToSubdivide);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    points = [];
    //requestAnimFrame(render);
}

