/*jslint browser: true, white: true */
/*global CanvasRenderingContext2D, requestAnimationFrame, console, MYGAME */
// ------------------------------------------------------------------
// 
// This is the game object.  Everything about the game is located in 
// this object.
//
// ------------------------------------------------------------------
MYGAME.graphics = (function() {
    'use strict';

    var canvas = document.getElementById('canvas-main');
    MYGAME.context = canvas.getContext('2d');
    MYGAME.blocksize = canvas.width / Math.min(MYGAME.width, MYGAME.height);

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function() {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, canvas.width, canvas.height);
        this.restore();
    };

    //------------------------------------------------------------------
    //
    // Public function that allows the client code to clear the canvas.
    //
    //------------------------------------------------------------------
    function clear() {
        context.clear();
    }

    //------------------------------------------------------------------
    //
    // This is used to create a texture function that can be used by client
    // code for rendering.
    //
    //------------------------------------------------------------------
    function Texture(spec) {
        var that = {};

        //todo

        return that;
    }

    return {
        clear: clear,
        Texture: Texture,
    };
}());

//------------------------------------------------------------------
//
// This function performs the one-time game initialization.
//
//------------------------------------------------------------------
MYGAME.initialize = (function initialize(graphics, images, input) {
    'use strict';

    var lastTimeStamp = performance.now;
    var elapsedTime;
    var Timer = 0;

    (function setVariables() {
        MYGAME.grid = [];
        console.log(MYGAME.blocksize);
        for (var i = 0; i < MYGAME.height; i++) {
            MYGAME.grid[i] = [];
            for (var j = 0; j < MYGAME.width; j++) {
                MYGAME.grid[i][j] = 0;
            }
        }
    }());

    //------------------------------------------------------------------
    //
    // This is the Game Loop function!
    //
    //------------------------------------------------------------------
    function gameLoop(time) {

        elapsedTime = time - lastTimeStamp;
        lastTimeStamp = time;
        Timer += elapsedTime;

        GatherInput();
        UpdateGameLogic(elapsedTime);
        Render();

        requestAnimationFrame(gameLoop);
    };

    function GatherInput() {

    }

    function UpdateGameLogic(delta) {

    }

    function Render() {
        for (var i = 0; i < MYGAME.height; i++) {
            for (var j = 0; j < MYGAME.width; j++) {

                var color;

                switch (MYGAME.grid[i][j]) {
                    case 0:
                        color = "rgb(0,50,200)";
                        break;
                    case 1:
                        color = "rgb(255,0,0)";
                        break;
                }
                MYGAME.context.fillStyle = color;
                MYGAME.context.fillRect(i * MYGAME.blocksize, j * MYGAME.blocksize, MYGAME.blocksize, MYGAME.blocksize);
            }
        }
    }

    return function() {
        console.log('game initializing...');
        //
        // Have to wait until here to create the texture, because the images aren't
        // loaded and ready until this point.

        requestAnimationFrame(gameLoop);
    };
}(MYGAME.graphics, MYGAME.images, MYGAME.input));
