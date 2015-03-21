/*jslint browser: true, white: true */
/*global CanvasRenderingContext2D, requestAnimationFrame, console, GAME */
// ------------------------------------------------------------------
// 
// This is the game object.  Everything about the game is located in 
// this object.
//
// ------------------------------------------------------------------
GAME.graphics = (function() {
    'use strict';

    var canvas = document.getElementById('canvas-main');
    GAME.context = canvas.getContext('2d');
    GAME.blocksize = canvas.width / (Math.min(GAME.width, GAME.height) * 2);

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
GAME.initialize = (function initialize(graphics, images, input) {
    'use strict';

    GAME.currtime = performance.now();
    GAME.falltimer = 0;
    GAME.newblocktimer = 10000;

    (function setVariables() {
        GAME.blocks = [];
        GAME.grid = [];
        for (var i = 0; i < GAME.width; i++) {
            GAME.grid[i] = [];
            for (var j = 0; j < GAME.height; j++) {
                GAME.grid[i][j] = 0;
            }
        }
    }());

    //------------------------------------------------------------------
    //
    // This is the Game Loop function!
    //
    //------------------------------------------------------------------
    function gameLoop() {

        var delta = performance.now() - GAME.currtime;
        GAME.currtime += delta;
        GAME.falltimer += delta;
        GAME.newblocktimer += delta;

        GatherInput();
        UpdateGameLogic(delta);
        Render();

        requestAnimationFrame(gameLoop);
    };

    function GatherInput() {

    }

    function UpdateGameLogic(delta) {
        if (GAME.falltimer > 1000) {
            GAME.falltimer -= 1000;
            for (var i = 0; i < GAME.blocks.length; i++) {
                fall(GAME.blocks[i]);
            }
        }

        if (GAME.newblocktimer > 10000) {
            GAME.newblocktimer -= 10000;
            makeNewBlock();
        }
    }

    function makeNewBlock() {
        var block = generateRandomBlock();
        GAME.blocks[GAME.blocks.length] = [block];
        placeBlockOnGrid(block);
    }

    function placeBlockOnGrid(block) {
        for (var i = 0; i < 4; i++) {
            var b = block[i];
            GAME.grid[b.x][b.y] = b.color;
        }
    }

    function random(top) {
        var ret = parseInt(Math.random() * top + 1);
        if (ret < 0)
            return 0;
        return ret;
    }

    function generateRandomBlock() {

        var ret = [];

        var type = random(6) + 1;
        var orientation = random(3);

        /*
        1 I
        2 J
        3 L
        4 O
        5 S
        6 T
        7 Z
        */

        var len = GAME.width;

        switch (type) {
            case 1: //I
                {
                    var startx;
                    if (orientation % 2 == 0) {
                        startx = random(len - 4);
                        for (var i = 0; i < 4; i++) {
                            ret[ret.length] = {
                                x: i + startx,
                                y: 0,
                                color: 1
                            };
                        }
                    } else {
                        startx = random(len - 1);
                        for (var i = 0; i < 4; i++) {
                            ret[ret.length] = {
                                x: startx,
                                y: 0 - i,
                                color: 1
                            };
                        }
                    }
                }
                break;
            case 2: //J
                {
                    var startx;
                    switch (orientation) {
                        case 0:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -2,
                                    color: 2
                                }];
                            }
                            break;
                        case 1:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }];
                            }
                            break;
                        case 2:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -2,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -2,
                                    color: 2
                                }];
                            }
                            break;
                        case 3:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx + 2,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: 0,
                                    color: 2
                                }];
                            }
                    }
                }
                break;
            case 3: //L
                {
                    var startx;
                    switch (orientation) {
                        case 0:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -2,
                                    color: 2
                                }];
                            }
                            break;
                        case 1:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: -1,
                                    color: 2
                                }];
                            }
                            break;
                        case 2:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -2,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -2,
                                    color: 2
                                }];
                            }
                            break;
                        case 3:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: -1,
                                    color: 2
                                }];
                            }
                    }
                }
                break;
            case 4: //O
                {
                    var startx = random(len - 2);
                    ret = [{
                        x: startx,
                        y: 0,
                        color: 2
                    }, {
                        x: startx + 1,
                        y: 0,
                        color: 2
                    }, {
                        x: startx,
                        y: -1,
                        color: 2
                    }, {
                        x: startx + 1,
                        y: -1,
                        color: 2
                    }];
                }
                break;
            case 5: //S
                {
                    var startx;
                    if (orientation % 2 == 0) {
                        startx = random(len - 3);
                        ret = [{
                            x: startx,
                            y: 0,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: 0,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: -1,
                            color: 2
                        }, {
                            x: startx + 2,
                            y: -1,
                            color: 2
                        }];
                    } else {
                        startx = random(len - 3);
                        ret = [{
                            x: startx + 1,
                            y: 0,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: -1,
                            color: 2
                        }, {
                            x: startx,
                            y: -1,
                            color: 2
                        }, {
                            x: startx,
                            y: -2,
                            color: 2
                        }];
                    }
                }
                break;
            case 6: //T
                {
                    switch (orientation) {
                        case 0:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: -1,
                                    color: 2
                                }];
                            }
                            break;
                        case 1:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -2,
                                    color: 2
                                }];
                            }
                            break;
                        case 2:
                            {
                                startx = random(len - 3);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 2,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }];
                            }
                            break;
                        case 3:
                            {
                                startx = random(len - 2);
                                ret = [{
                                    x: startx,
                                    y: 0,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx + 1,
                                    y: -1,
                                    color: 2
                                }, {
                                    x: startx,
                                    y: -2,
                                    color: 2
                                }];
                            }
                    }
                }
                break;
            case 7: //Z
                {
                    var startx;
                    if (orientation % 2 == 0) {
                        startx = random(len - 3);
                        ret = [{
                            x: startx + 1,
                            y: 0,
                            color: 2
                        }, {
                            x: startx + 2,
                            y: 0,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: -1,
                            color: 2
                        }, {
                            x: startx,
                            y: -1,
                            color: 2
                        }];
                    } else {
                        startx = random(len - 3);
                        ret = [{
                            x: startx,
                            y: 0,
                            color: 2
                        }, {
                            x: startx,
                            y: -1,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: -1,
                            color: 2
                        }, {
                            x: startx + 1,
                            y: -2,
                            color: 2
                        }];
                    }
                }
        }

        return ret;
    }

    function Render() {
        for (var i = 0; i < GAME.width; i++) {
            for (var j = 0; j < GAME.height; j++) {

                var color;

                switch (GAME.grid[i][j]) {
                    case 0:
                        color = "rgb(50,50,50)";
                        break;
                    case 1:
                        color = "rgb(255,0,0)";
                        break;
                    case 2:
                        color = "rgb(255,0,255)";
                        break;
                    case 3:
                        color = "rgb(255,255,0)";
                        break;
                    case 4:
                        color = "rgb(0,255,255)";
                        break;
                    case 5:
                        color = "rgb(0,0,255)";
                        break;
                    case 6:
                        color = "rgb(200,200,200)";
                        break;
                    case 7:
                        color = "rgb(0,255,0)";
                        break;
                }
                GAME.context.fillStyle = color;
                GAME.context.fillRect(i * GAME.blocksize, j * GAME.blocksize, GAME.blocksize, GAME.blocksize);
            }
        }
    }

    function fall(block) {
        for (var i = 0; i < block.length; i++) {
            var chunk = block[i];
            var i = chunk.x;
            var j = chunk.y;
            if (j < GAME.height - 1 && (j >= 0 ? GAME.grid[i][j + 1] == 0 : true)) {
                GAME.grid[i][j + 1] = chunk.color;
                GAME.grid[i][j] = 0;
                chunk.y++;
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
}(GAME.graphics, GAME.images, GAME.input));