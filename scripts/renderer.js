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
        GAME.context.clear();
    }

    function drawImage(spec) {
        GAME.context.save();

        GAME.context.translate(spec.center.x, spec.center.y);
        GAME.context.rotate(spec.rotation);
        GAME.context.translate(-spec.center.x, -spec.center.y);

        GAME.context.drawImage(
            spec.image,
            spec.center.x - spec.size / 2,
            spec.center.y - spec.size / 2,
            spec.size, spec.size);

        GAME.context.restore();
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
        drawImage: drawImage
    };
}());

//------------------------------------------------------------------
//
// This function performs the one-time game initialization.
//
//------------------------------------------------------------------
GAME.initialize = function initialize() {
    'use strict';

    var smoke = GAME.particleSystem({
        image: GAME.images['img/fire.png'],
        center: {
            x: 0,
            y: 0
        },
        speed: {
            mean: 40,
            stdev: 10
        },
        lifetime: {
            mean: 2,
            stdev: 0.8
        }
    });

    GAME.currtime = performance.now();
    GAME.falltimer = 0;
    GAME.newblocktimer = 5000;
    GAME.sweeptimer = 0;
    GAME.sweeptime = 400;

    (function setVariables() {
        GAME.score = 0;
        GAME.currentKey = 0;
        GAME.keyIsPressed = false;
        GAME.changed_flag = false;
        GAME.pending_block = null;
        GAME.particles = [];
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
        makeNewBlock();
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

        GatherInput();
        UpdateGameLogic(delta);
        Render(delta);

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
        GAME.currtime += delta;
        GAME.falltimer += delta;
        GAME.newblocktimer += delta;

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
            var l = GAME.blocks.length;
            GAME.activeBlock = l;
            moveIntoBoundsVert(GAME.pending_block);
            GAME.blocks[l] = GAME.pending_block;
            placeBlockOnGrid(GAME.pending_block);
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
                    if (canMoveDown(active)) {
                        moveDown(active, 1);
                        GAME.falltimer = 0;
                    }
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

    function Render(delta) {
        var color;
        GAME.graphics.clear();
        for (var i = 0; i < GAME.width; i++) {
            for (var j = 0; j < GAME.height; j++) {
                GAME.context.fillStyle = getColor(GAME.grid[i][j]);
                GAME.context.fillRect(i * GAME.blocksize, j * GAME.blocksize, GAME.blocksize, GAME.blocksize);
            }
        }

        if (GAME.pending_block != null) {
            var minx = 5;
            var miny = 5;
            for (var i = 0; i < 4; i++) {
                var b = GAME.pending_block.chunks[i];
                if (b.x < minx)
                    minx = b.x;
                if (b.y < miny)
                    miny = b.y;
            }
            while (minx > 0) {
                minx--;
                for (var i = 0; i < 4; i++) {
                    GAME.pending_block.chunks[i].x--;
                }
            }
            while (minx < 0) {
                minx++;
                for (var i = 0; i < 4; i++) {
                    GAME.pending_block.chunks[i].x++;
                }
            }
            while (miny > 0) {
                miny--;
                for (var i = 0; i < 4; i++) {
                    GAME.pending_block.chunks[i].y--;
                }
            }
            while (miny < 0) {
                miny++;
                for (var i = 0; i < 4; i++) {
                    GAME.pending_block.chunks[i].y++;
                }
            }
            GAME.context.fillStyle = getColor(GAME.pending_block.color);
            var basex = GAME.blocksize * GAME.width + GAME.blocksize * 2;
            var basey = GAME.blocksize * 2;
            for (var i = 0; i < 4; i++) {
                var b = GAME.pending_block.chunks[i];
                GAME.context.fillRect(basex + b.x * GAME.blocksize, basey + b.y * GAME.blocksize, GAME.blocksize, GAME.blocksize);
            }
        }
        if (GAME.particles.length > 0) {
            GAME.sweeptimer += delta;
            for (var i = 0; i < GAME.particles.length; i++) {
                var p = GAME.particles[i];
                if (GAME.sweeptimer < GAME.sweeptime) {
                    smoke.setCenter({
                        x: (GAME.sweeptimer / GAME.sweeptime) * GAME.blocksize * GAME.width,
                        y: GAME.blocksize / 2 + p * GAME.blocksize
                    });
                    smoke.create();
                    smoke.create();
                    smoke.create();
                    smoke.create();
                }
            }
            smoke.update(delta / 1000);
            smoke.render();
            if (smoke.isEmpty()) {
                GAME.sweeptimer = 0;
                GAME.particles = [];
            }
        }
    }

    function getColor(b) {
        switch (b) {
            case 0:
                return "rgb(50,50,50)";
            case 1:
                return "rgb(255,0,0)";
            case 2:
                return "rgb(255,0,255)";
            case 3:
                return "rgb(255,255,0)";
            case 4:
                return "rgb(0,255,255)";
            case 5:
                return "rgb(0,0,255)";
            case 6:
                return "rgb(200,200,200)";
            case 7:
                return "rgb(0,255,0)";
        }
    }

    function makeNewBlock() {
        var block = generateRandomBlock();
        moveIntoBoundsHoriz(block);
        moveIntoBoundsVert(block);
        var temp = [];
        for (var i = 0; i < 4; i++) {
            if (block.chunks[i].y == 0) {
                temp[temp.length] = block.chunks[i];
            }
        }
        var trycount = 0;
        var can_make = true;
        for (var i = 0; i < temp.length; i++) {
            if (GAME.grid[temp[i].x][temp[i].y] != 0) {
                move(block, (random(2) - 1 == 0 ? 1 : -1));
                i = -1;
                if (trycount++ > GAME.width) {
                    can_make = false;
                }
            }
        }
        if (can_make) {
            GAME.pending_block = block;
        } else {
            // YOU LOSE!!
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

    function checkForClears() {
        var rows = [];
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
                GAME.sweeptimer = 0;
                rows[rows.length] = i;
                GAME.score++;
            }
        }
        for (var i = 0; i < rows.length; i++) {
            clearRow(rows[i]);
        }
    }

    function clearRow(r) {
        GAME.particles[GAME.particles.length] = r;
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


    function canMoveDown(block) {
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
        return ret;
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

    function moveDown(block, dist) {
        if (dist > 0) {
            while (dist-- > 0) {
                for (var i = 0; i < 4; i++) {
                    block.chunks[i].y++;
                }
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

    function addToGround(b) {
        var c = GAME.blocks[b];
        for (var i = 0; i < 4; i++) {
            var chunk = c.chunks[i];
            GAME.ground[chunk.x][chunk.y] = 1;
        }
        GAME.blocks.splice(b, 1);
    }

    function hardDrop(block) {
        while (canMoveDown(block)) {
            removeBlockFromGrid(block);
            moveDown(block, 1);
            placeBlockOnGrid(block);
        }
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
            for (var j = min; j < 0; j++) {
                for (var i = 0; i < 4; i++) {
                    c[i].x++;
                }
            }
        } else if (max > GAME.width - 1) {
            var diff = max - (GAME.width - 1);
            for (var j = 0; j < diff; j++) {
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
            for (var j = 0; j < max; j++) {
                for (var i = 0; i < 4; i++) {
                    c[i].y--;
                }
            }
        } else if (min < -3) {
            var diff = min + 3;
            for (var j = 0; j > diff; j--) {
                for (var i = 0; i < 4; i++) {
                    c[i].y++;
                }
            }
        }
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

    function rotateCounterClockwise(block) {
        rotateClockwise(block);
        rotateClockwise(block);
        rotateClockwise(block);
    }

    function isInBounds(x, y) {
        return x >= 0 && x < GAME.width && y < GAME.height;
    }

    function isOnGround(x, y) {

        if (y < -1) {
            return false;
        }
        if (y >= GAME.height - 1) {
            return true;
        }
        return GAME.ground[x][y + 1] == 1;
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
                                d[0].x++;
                                d[0].y--;
                                d[2].x--;
                                d[2].y++;
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

    requestAnimationFrame(gameLoop);

};