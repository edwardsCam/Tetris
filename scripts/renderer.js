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

    var canvas = document.getElementById('canvas-main'),
        context = canvas.getContext('2d');

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


    //------------------------------------------------------------------
    //
    // This is the Game Loop function!
    //
    //------------------------------------------------------------------
    function gameLoop(time) {

        elapsedTime = time - lastTimeStamp;
        lastTimeStamp = time;
        Timer += elapsedTime;

        requestAnimationFrame(gameLoop);
    };

    return function() {
        console.log('game initializing...');
        //
        // Have to wait until here to create the texture, because the images aren't
        // loaded and ready until this point.

        setEnvironment();
        requestAnimationFrame(gameLoop);
    };
}(MYGAME.graphics, MYGAME.images, MYGAME.input));
