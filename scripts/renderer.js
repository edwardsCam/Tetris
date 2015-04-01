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
        GAME.score = 0;
        GAME.currentKey = 0;
        GAME.keyIsPressed = false;
        GAME.changed_flag = false;
        GAME.blocks = [];
        GAME.ground = [];
        GAME.grid = [];
        GAME.activeBlock = 0;
        for (var i = 0; i < GAME.width; i++) {
            GAME.grid[i] = [];
            GAME.ground[i] = [];
            for (var j = 0; j < GAME.height; j++) {
                GAME.grid[i][j] = 0;
                GAME.ground[i][j] = 0;
            }
        }
    }());

    function random(top) {
        var ret = Math.floor(Math.random() * top) + 1;
        if (ret < 0)
            return 0;
        return ret;
    }

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
        document.onkeydown = checkKey;
        document.onkeyup = releaseKey;

        function checkKey(e) {
            if (!GAME.keyIsPressed) {
                GAME.keyIsPressed = true;
                GAME.currentKey = e.keyCode;
            }
        }

        function releaseKey() {
            GAME.keyIsPressed = false;
        }
    }

    function UpdateGameLogic(delta) {
        if (GAME.falltimer > 500) {
            GAME.falltimer -= 500;
            for (var i = 0; i < GAME.blocks.length; i++) {
                if (!fall(GAME.blocks[i])) {
                    addToGround(i--);
                    GAME.newblocktimer = 10000;
                }
            }
        }

        if (GAME.newblocktimer > 10000) {
            GAME.newblocktimer -= 10000;
            makeNewBlock();
        }

        var k = GAME.currentKey;
        if (k != 0) {
            var active = GAME.blocks[GAME.activeBlock];
            if (active) {
                removeBlockFromGrid(active);
                if (k == 65) { // a
                    move(active, -1);
                } else if (k == 68) { // d
                    move(active, 1);
                } else if (k == 83) { // s
                    moveDown(active, 1);
                    GAME.falltimer = 0;
                } else if (k == 87) { // w
                    hardDrop(active);
                    GAME.newblocktimer = 9000;
                } else if (k == 81) { // q
                    rotateCounterClockwise(active);
                } else if (k == 69) { // e
                    rotateClockwise(active);
                }
                placeBlockOnGrid(active);
                GAME.changed_flag = true;
            }
        }

        if (GAME.changed_flag) {
            GAME.currentKey = 0;
            GAME.changed_flag = false;
        }

        checkForClears();
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

    function checkForClears() {
        for (var i = GAME.height - 1; i >= 0; i--) {
            var hasBlock = false;
            var blockCount = 0;
            for (var j = 0; j < GAME.width; j++) {
                if (GAME.ground[j][i] == 1) {
                    hasBlock = true;
                    blockCount++;
                }
            }
            if (!hasBlock) {
                break;
            }
            if (blockCount == GAME.width) {
                clearRow(i++);
                GAME.score++;
            }
        }
    }

    function clearRow(r) {
        for (var i = 0; i < GAME.width; i++) {
            GAME.ground[i][r] = 0;
            GAME.grid[i][r] = 0;
        }
        dropGround(r);
    }

    function dropGround(r) {
        for (var y = r; y >= 0; y--) {
            for (var x = 0; x < GAME.width; x++) {
                if (GAME.ground[x][y] == 1) {
                    if (y < GAME.height - 1) {
                        GAME.grid[x][y + 1] = GAME.grid[x][y];
                        GAME.ground[x][y + 1] = 1;
                    }
                    GAME.grid[x][y] = 0;
                    GAME.ground[x][y] = 0;
                    y++;
                }
            }
        }
    }

    function fall(block) {
        if (canMoveDown(block)) {
            removeBlockFromGrid(block);
            moveDown(block, 1);
            placeBlockOnGrid(block);
            return true;
        }
        return false;
    }

    function hardDrop(block) {
        while (canMoveDown(block)) {
            removeBlockFromGrid(block);
            moveDown(block, 1);
            placeBlockOnGrid(block);
        }
    }

    function canMoveDown(block) {
        removeBlockFromGrid(block);
        var ret = true;
        for (var i = 0; i < 4; i++) {
            var b = block.chunks[i];
            var x = b.x;
            var y = b.y;
            if (isOnGround(x, y)) {
                ret = false;
                break;
            }
        }
        placeBlockOnGrid(block);
        return ret;
    }

    function removeBlockFromGrid(block) {
        for (var i = 0; i < 4; i++) {
            var b = block.chunks[i];
            var x = b.x;
            var y = b.y;
            if (isInBounds(x, y)) {
                GAME.grid[x][y] = 0;
            }
        }
    }

    function placeBlockOnGrid(block) {
        for (var i = 0; i < 4; i++) {
            var b = block.chunks[i];
            var x = b.x;
            var y = b.y;
            if (isInBounds(x, y)) {
                GAME.grid[x][y] = block.color;
            }
        }
    }

    function isInBounds(x, y) {
        return x >= 0 && x < GAME.width && y < GAME.height;
    }

    function isOnGround(x, y) {
        return y >= 0 && (y >= GAME.height - 1 || (isInBounds(x, y - 1) ? GAME.grid[x][y + 1] != 0 : true));
    }

    function moveDown(block, dist) {
        while (dist-- > 0) {
            for (var i = 0; i < 4; i++) {
                block.chunks[i].y++;
            }
        }
    }

    function move(block, dist) {
        while (dist != 0) {
            if (canMoveHoriz(block, dist)) {
                for (var i = 0; i < 4; i++) {
                    block.chunks[i].x += dist;
                }
            }
            if (dist < 0)
                dist++;
            else
                dist--;
        }
    }

    function canMoveHoriz(block, dist) {
        if (dist == 0)
            return true;
        if (dist < 0) {
            for (var i = 0; i < 4; i++) {
                if (block.chunks[i].x == 0) {
                    return false;
                }
            }
        } else {
            for (var i = 0; i < 4; i++) {
                if (block.chunks[i].x == GAME.width - 1) {
                    return false;
                }
            }
        }

        return true;
    }

    function addToGround(b) {
        var c = GAME.blocks[b];
        for (var i = 0; i < 4; i++) {
            var chunk = c.chunks[i];
            GAME.ground[chunk.x][chunk.y] = 1;
        }
        GAME.blocks.splice(b, 1);
    }

    function makeNewBlock() {
        var block = generateRandomBlock();
        moveIntoBoundsHoriz(block);
        moveIntoBoundsVert(block);
        var i = GAME.blocks.length;
        GAME.activeBlock = i;
        GAME.blocks[i] = block;
        placeBlockOnGrid(block);
    }

    function moveIntoBoundsHoriz(block) {
        var c = block.chunks;
        var min = GAME.width;
        var max = -5;

        for (var i = 0; i < 4; i++) {
            if (c[i].x < min) {
                min = c[i].x;
            }
            if (c[i].x > max) {
                max = c[i].x;
            }
        }
        if (min < 0) {
            while (min++ < 0) {
                for (var i = 0; i < 4; i++) {
                    c[i].x++;
                }
            }
        } else if (max > GAME.width - 1) {
            while (max-- > GAME.width - 1) {
                for (var i = 0; i < 4; i++) {
                    c[i].x--;
                }
            }
        }
    }

    function moveIntoBoundsVert(block) {
        var c = block.chunks;
        var min = 1;
        var max = -5;
        for (var i = 0; i < 4; i++) {
            if (c[i].y < min) {
                min = c[i].y;
            }
            if (c[i].y > max) {
                max = c[i].y;
            }
        }
        if (max > 0) {
            while (max-- > 0) {
                for (var i = 0; i < 4; i++) {
                    c[i].y--;
                }
            }
        } else if (min < -3) {
            while (min++ < -3) {
                for (var i = 0; i < 4; i++) {
                    c[i].y++;
                }
            }
        }
    }

    function rotateCounterClockwise(block) {
        rotateClockwise(block);
        rotateClockwise(block);
        rotateClockwise(block);
    }

    function rotateClockwise(block) {
        var c = block.chunks;
        var d = [{
            x: c[0].x,
            y: c[0].y
        }, {
            x: c[1].x,
            y: c[1].y
        }, {
            x: c[2].x,
            y: c[2].y
        }, {
            x: c[3].x,
            y: c[3].y
        }];
        switch (block.color) {
            case 1:
                {
                    switch (block.dir) {
                        case 0:
                            {
                                d[0].x++
                                    d[0].y--;
                                d[2].x--;
                                d[2].y++
                                    d[3].x -= 2;
                                d[3].y += 2;
                            }
                            break;
                        case 1:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[2].x++;
                                d[2].y--;
                                d[3].x += 2;
                                d[3].y -= 2;
                            }
                    }
                }
                break;
            case 2:
                {
                    switch (block.dir) {
                        case 0:
                            {
                                d[0].x++;
                                d[0].y--;
                                d[2].x++;
                                d[2].y++;
                                d[3].x += 2;
                                d[3].y += 2;
                            }
                            break;
                        case 1:
                            {
                                d[0].x++;
                                d[0].y++;
                                d[2].x--;
                                d[2].y++;
                                d[3].x -= 2;
                                d[3].y += 2;
                            }
                            break;
                        case 2:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[2].x--;
                                d[2].y--;
                                d[3].x -= 2;
                                d[3].y -= 2;
                            }
                            break;
                        case 3:
                            {
                                d[0].x--;
                                d[0].y--;
                                d[2].x++;
                                d[2].y--;
                                d[3].x += 2;
                                d[3].y -= 2;
                            }
                    }
                }
                break;
            case 3:
                {
                    switch (block.dir) {

                        case 0:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[2].x++;
                                d[2].y++;
                                d[3].x += 2;
                                d[3].y += 2;
                            }
                            break;
                        case 1:
                            {
                                d[0].x--;
                                d[0].y--;
                                d[2].x--;
                                d[2].y++;
                                d[3].x -= 2;
                                d[3].y += 2;
                            }
                            break;
                        case 2:
                            {
                                d[0].x++;
                                d[0].y--;
                                d[2].x--;
                                d[2].y--;
                                d[3].x -= 2;
                                d[3].y -= 2;
                            }
                            break;
                        case 3:
                            {
                                d[0].x++;
                                d[0].y++;
                                d[2].x++;
                                d[2].y--;
                                d[3].x += 2;
                                d[3].y -= 2;
                            }
                    }
                }
                break;
            case 5:
                {
                    switch (block.dir) {
                        case 0:
                            {
                                d[0].x++;
                                d[0].y--;
                                d[2].x++;
                                d[2].y++;
                                d[3].y += 2;
                            }
                            break;
                        case 1:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[2].x--;
                                d[2].y--;
                                d[3].y -= 2;
                            }
                    }
                }
                break;
            case 6:
                {
                    switch (block.dir) {
                        case 0:
                            {
                                d[0].x--;
                                d[0].y--;
                                d[1].x++;
                                d[1].y--;
                                d[3].x--;
                                d[3].y++;
                            }
                            break;
                        case 1:
                            {
                                d[0].x++;
                                d[0].y--;
                                d[1].x++;
                                d[1].y++;
                                d[3].x--;
                                d[3].y--;
                            }
                            break;
                        case 2:
                            {
                                d[0].x++;
                                d[0].y++;
                                d[1].x--;
                                d[1].y++;
                                d[3].x++;
                                d[3].y--;
                            }
                            break;
                        case 3:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[1].x--;
                                d[1].y--;
                                d[3].x++;
                                d[3].y++;
                            }
                    }
                }
                break;
            case 7:
                {
                    switch (block.dir) {
                        case 0:
                            {
                                d[0].x--;
                                d[0].y++;
                                d[2].x++;
                                d[2].y++;
                                d[3].x += 2;
                            }
                            break;
                        case 1:
                            {
                                d[0].x++;
                                d[0].y--;
                                d[2].x--;
                                d[2].y--;
                                d[3].x -= 2;
                            }
                    }
                }
                break;
        }
        var can_rotate = true;
        for (var i = 0; i < 4; i++) {
            var ox = d[i].x;
            var oy = d[i].y;
            if (isInBounds(ox, oy) && GAME.grid[ox][oy] != 0) {
                can_rotate = false;
                break;
            }
        }

        if (can_rotate) {
            for (var i = 0; i < 4; i++) {
                c[i].x = d[i].x;
                c[i].y = d[i].y;
            }
            var co = block.color;
            block.dir = ++block.dir % ((co == 1 || co == 5 || co == 7) ? 2 : 4);
            moveIntoBoundsHoriz(block);
        }
    }

    function generateRandomBlock() {

        var ret = [];

        var type = random(7);
        var orientation = random(4) - 1;

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
                    ret = {
                        chunks: [{
                            x: 0,
                            y: 0
                        }, {
                            x: 1,
                            y: 0
                        }, {
                            x: 2,
                            y: 0
                        }, {
                            x: 3,
                            y: 0
                        }],
                        dir: 0,
                        color: 1
                    };
                    move(ret, random(len - 3) - 1);
                    for (var i = 0; i < orientation % 2; i++) {
                        rotateClockwise(ret);
                    }

                }
                break;
            case 2: //J
                {
                    ret = {
                        chunks: [{
                            x: 0,
                            y: 0
                        }, {
                            x: 1,
                            y: 0
                        }, {
                            x: 1,
                            y: -1
                        }, {
                            x: 1,
                            y: -2
                        }],
                        dir: 0,
                        color: 2
                    };
                    move(ret, random(len - 1) - 1);
                    for (var i = 0; i < orientation; i++) {
                        rotateClockwise(ret);
                    }
                }
                break;
            case 3: //L
                {
                    ret = {
                        chunks: [{
                            x: 1,
                            y: 0
                        }, {
                            x: 0,
                            y: 0
                        }, {
                            x: 0,
                            y: -1
                        }, {
                            x: 0,
                            y: -2
                        }],
                        dir: 0,
                        color: 3
                    };
                    move(ret, random(len - 1) - 1);
                    for (var i = 0; i < orientation; i++) {
                        rotateClockwise(ret);
                    }
                }
                break;
            case 4: //O
                {
                    ret = {
                        chunks: [{
                            x: 0,
                            y: 0
                        }, {
                            x: 1,
                            y: 0
                        }, {
                            x: 1,
                            y: -1
                        }, {
                            x: 0,
                            y: -1
                        }],
                        dir: 0,
                        color: 4
                    };
                    move(ret, random(len - 1) - 1);
                }
                break;
            case 5: //S
                {
                    ret = {
                        chunks: [{
                            x: 0,
                            y: 0
                        }, {
                            x: 1,
                            y: 0
                        }, {
                            x: 1,
                            y: -1
                        }, {
                            x: 2,
                            y: -1
                        }],
                        dir: 0,
                        color: 5
                    };
                    move(ret, random(len - 2) - 1);
                    for (var i = 0; i < orientation % 2; i++) {
                        rotateClockwise(ret);
                    }
                }
                break;
            case 6: //T
                {
                    ret = {
                        chunks: [{
                            x: 1,
                            y: 0
                        }, {
                            x: 0,
                            y: -1
                        }, {
                            x: 1,
                            y: -1
                        }, {
                            x: 2,
                            y: -1
                        }],
                        dir: 0,
                        color: 6
                    };
                    move(ret, random(len - 2) - 1);
                    for (var i = 0; i < orientation; i++) {
                        rotateClockwise(ret);
                    }
                }
                break;
            case 7: //Z
                {
                    ret = {
                        chunks: [{
                            x: 2,
                            y: 0
                        }, {
                            x: 1,
                            y: 0
                        }, {
                            x: 1,
                            y: -1
                        }, {
                            x: 0,
                            y: -1
                        }],
                        dir: 0,
                        color: 7
                    };
                    move(ret, random(len - 2) - 1);
                    for (var i = 0; i < orientation % 2; i++) {
                        rotateClockwise(ret);
                    }
                }
        }

        return ret;
    }

    return function() {
        console.log('game initializing...');
        //
        // Have to wait until here to create the texture, because the images aren't
        // loaded and ready until this point.

        requestAnimationFrame(gameLoop);
    };
}(GAME.graphics, GAME.images, GAME.input));