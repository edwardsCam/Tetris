/*jslint browser: true, white: true */
/*global CanvasRenderingContext2D, requestAnimationFrame, console, GAME */
// ------------------------------------------------------------------
// 
// This is the game object.  Everything about the game is located in 
// this object.
//
// ------------------------------------------------------------------
GAME.playSound = function(whichSound) {
    GAME.sounds['audio/' + whichSound + '.' + GAME.audioExt].play();
};

GAME.pauseSound = function(whichSound) {
    GAME.sounds['audio/' + whichSound + '.' + GAME.audioExt].pause();
};

GAME.graphics = (function() {
    'use strict';

    GAME.canvas = document.getElementById('canvas-main');
    GAME.context = GAME.canvas.getContext('2d');
    GAME.blocksize = GAME.canvas.width / (Math.min(GAME.width, GAME.height) * 2);

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function() {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, GAME.canvas.width, GAME.canvas.height);
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

    GAME.playSound("theme");

    var all_colors = [{
        top: '#1879BD',
        bottom: '#084D79'
    }, {
        top: '#678834',
        bottom: '#093905'
    }, {
        top: '#EB7723',
        bottom: '#A80000'
    }];


    var mousePosition = {
        x: 0,
        y: 0
    };
    var mousePressed = false;

    /**
     * Track the user's mouse position on mouse move.
     * @param {Event} event
     */
    GAME.canvas.addEventListener('mousemove', function(event) {
        mousePosition.x = event.offsetX || event.layerX;
        mousePosition.y = event.offsetY || event.layerY;
    });

    /**
     * Track the user's clicks.
     * @param {Event} event
     */
    GAME.canvas.addEventListener('mousedown', function(event) {
        mousePressed = true;
    });
    GAME.canvas.addEventListener('mouseup', function(event) {
        mousePressed = false;
    });



    function Button(x, y, w, h, text, colors, action) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.colors = colors;
        this.text = text;

        this.state = 'default'; // current button state

        var isClicking = false;

        /**
         * Check to see if the user is hovering over or clicking on the button.
         */
        this.update = function() {
            // check for hover
            if (mousePosition.x >= this.x && mousePosition.x <= this.x + this.width && mousePosition.y >= this.y && mousePosition.y <= this.y + this.height) {
                this.state = 'hover';

                // check for click
                if (mousePressed) {
                    this.state = "active";
                    isClicking = true;
                } else {
                    if (isClicking) {
                        action();
                    }
                    isClicking = false;
                }
            } else {
                this.state = 'default';
            }
        };

        /**
         * Draw the button.
         */
        this.draw = function() {
            GAME.context.save();
            GAME.context.font = '15px sans-serif';
            var colors = this.colors[this.state];
            var halfH = this.height / 2;

            // button
            GAME.context.fillStyle = colors.top;
            GAME.context.fillRect(this.x, this.y, this.width, halfH);
            GAME.context.fillStyle = colors.bottom;
            GAME.context.fillRect(this.x, this.y + halfH, this.width, halfH);

            // text
            var size = GAME.context.measureText(this.text);
            var x = this.x + (this.width - size.width / 2) / 2;
            var y = this.y + (this.height - 15) / 2 + 12;

            GAME.context.fillStyle = '#FFF';

            GAME.context.fillText(this.text, x, y);

            GAME.context.restore();
        };
    }

    var bw = 200,
        bh = 50;

    var default_colors = {
        'default': all_colors[0],
        'hover': all_colors[1],
        'active': all_colors[2]
    };

    GAME.backButton = new Button(GAME.blocksize * GAME.width + 50, GAME.canvas.height / 2 + 100, bw, bh, 'Back', default_colors,
        function() {
            document.location.href = "../";
        });


    $.ajax({
        url: 'http://localhost:3000/v1/controls',
        cache: false,
        type: 'GET',
        error: function() {
            alert('GET failed');
        },
        success: function(data) {
            for (var i = 0; i < 7; i++) {
                GAME.controls[data[i].name] = data[i].key;
            }
        }
    });

    var fire = GAME.particleSystem({
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
    GAME.sweeptimer = 0;
    GAME.sweeptime = 400;

    (function setVariables() {
        GAME.over = false;
        GAME.drewNameInput = false;
        GAME.paused = false;
        GAME.controls = [];
        GAME.pulse = 400;
        GAME.newblocktime = GAME.pulse * GAME.height;
        GAME.newblocktimer = GAME.newblocktime - 2000;
        GAME.level = 1;
        GAME.lines_cleared = 0;
        GAME.score = 0;
        GAME.level_threshold = 5;
        GAME.currentKey = 0;
        GAME.keyIsPressed = false;
        GAME.changed_flag = false;
        GAME.pending_block = null;
        GAME.particles = [];
        GAME.particle_timers = [];
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

        if (!GAME.over) {
            GatherInput();
            UpdateGameLogic(delta);
        }
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
        if (!GAME.paused) {
            if (GAME.lines_cleared >= GAME.level_threshold) {
                GAME.playSound("SFX_LevelUp");
                GAME.lines_cleared -= GAME.level_threshold;
                GAME.level++;
                GAME.pulse -= 50;
                if (GAME.pulse < 150) {
                    GAME.pulse = 150;
                }
                GAME.newblocktime = GAME.pulse * GAME.height;
                GAME.newblocktimer = GAME.newblocktime - 2000;
            }

            GAME.falltimer += delta;
            GAME.newblocktimer += delta;

            if (GAME.falltimer > GAME.pulse) {
                GAME.falltimer -= GAME.pulse;
                for (var i = 0; i < GAME.blocks.length; i++) {
                    if (!fall(GAME.blocks[i])) {
                        addToGround(i--);
                        GAME.newblocktimer = GAME.newblocktime;
                    } else {
                        GAME.playSound("SFX_PieceSoftDrop");
                    }
                }
            }

            if (GAME.newblocktimer > GAME.newblocktime) {
                GAME.newblocktimer -= GAME.newblocktime;
                var l = GAME.blocks.length;
                GAME.activeBlock = l;
                moveIntoBoundsVert(GAME.pending_block);
                GAME.blocks[l] = GAME.pending_block;
                placeBlockOnGrid(GAME.pending_block);
                makeNewBlock();
            }

        } else if (GAME.currentKey == GAME.controls['pause'] && !GAME.changed_flag) {
            GAME.paused = !GAME.paused;
            GAME.changed_flag = true;
        }
        if (!GAME.paused) {
            var k = GAME.currentKey;
            if (k != 0) {
                var active = GAME.blocks[GAME.activeBlock];
                if (active) {
                    removeBlockFromGrid(active);
                    if (k == GAME.controls['pause'] && !GAME.changed_flag) {
                        GAME.paused = !GAME.paused;
                    } else if (k == GAME.controls['left']) {
                        if (canMoveHoriz(active, -1)) {
                            GAME.playSound("SFX_PieceSoftDrop");
                            move(active, -1);
                        }
                    } else if (k == GAME.controls['right']) {
                        if (canMoveHoriz(active, 1)) {
                            GAME.playSound("SFX_PieceSoftDrop");
                            move(active, 1);
                        }
                    } else if (k == GAME.controls['soft']) {
                        if (canMoveDown(active)) {
                            GAME.playSound("SFX_PieceSoftDrop");
                            moveDown(active, 1);
                            GAME.falltimer = 0;
                        }
                    } else if (k == GAME.controls['hard']) {
                        GAME.playSound("SFX_PieceHardDrop");
                        hardDrop(active);
                        GAME.newblocktimer = GAME.pulse * GAME.height - 1000;
                    } else if (k == GAME.controls['counterclock']) {
                        GAME.playSound("SFX_PieceRotateLR");
                        rotateCounterClockwise(active);
                    } else if (k == GAME.controls['clock']) {
                        GAME.playSound("SFX_PieceRotateLR");
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
    }

    function Render(delta) {
        GAME.graphics.clear();
        GAME.backButton.update();
        GAME.backButton.draw();
        drawBoard();
        drawPending();
        drawParticles(delta);
        drawScore();
        if (GAME.over) {
            GAME.context.fillStyle = "rgb(240, 240, 240)";
            GAME.context.fillRect(0, GAME.canvas.height / 2 - GAME.canvas.height / 4, GAME.canvas.width, GAME.canvas.height / 3);
            GAME.context.fillStyle = "rgb(200, 0, 0)";
            GAME.context.font = '70px sans-serif';
            GAME.context.fillText("GAME OVER", GAME.canvas.width / 2 - 180, GAME.canvas.height / 2);
            if (!GAME.drewNameInput) {
                var div = document.getElementById("id-name-input-div");
                var str = '<span class="inp-field-left" style="position:absolute;left:500px;top:225px;width:1000px;">';
                str += 'Name: ';
                str += '<input type="text" id="id-name-input"/>';
                str += '<input type="submit" value="Submit" onClick="GAME.submitHighScore();"/>';
                str += '</span>';
                div.innerHTML = str;
                GAME.drewNameInput = true;
            }
        } else if (GAME.paused) {
            GAME.context.fillStyle = "rgb(200, 0, 0)";
            GAME.context.font = '70px sans-serif';
            GAME.context.fillText("Paused", GAME.canvas.width / 2 - 90, GAME.canvas.height / 2);
        }
    }

    function drawBoard() {
        for (var i = 0; i < GAME.width; i++) {
            for (var j = 0; j < GAME.height; j++) {
                GAME.context.fillStyle = getColor(GAME.grid[i][j]);
                GAME.context.fillRect(i * GAME.blocksize, j * GAME.blocksize, GAME.blocksize, GAME.blocksize);
            }
        }
    }

    function drawPending() {
        var basex = GAME.blocksize * GAME.width + GAME.blocksize * 2;
        var basey = GAME.blocksize * 2;
        GAME.context.fillStyle = getColor(0);
        GAME.context.font = '15px sans-serif';
        GAME.context.fillText("Next block:", basex, GAME.blocksize * 1.5);
        var temp = [{
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }];
        var minx = 100;
        var miny = 100;
        for (var i = 0; i < 4; i++) {
            temp[i].x = GAME.pending_block.chunks[i].x;
            temp[i].y = GAME.pending_block.chunks[i].y;
            var b = temp[i];
            if (b.x < minx)
                minx = b.x;
            if (b.y < miny)
                miny = b.y;
        }
        while (minx > 0) {
            minx--;
            for (var i = 0; i < 4; i++) {
                temp[i].x--;
            }
        }
        while (minx < 0) {
            minx++;
            for (var i = 0; i < 4; i++) {
                temp[i].x++;
            }
        }
        while (miny > 0) {
            miny--;
            for (var i = 0; i < 4; i++) {
                temp[i].y--;
            }
        }
        while (miny < 0) {
            miny++;
            for (var i = 0; i < 4; i++) {
                temp[i].y++;
            }
        }
        GAME.context.fillStyle = getColor(GAME.pending_block.color);
        for (var i = 0; i < 4; i++) {
            var b = temp[i];
            GAME.context.fillRect(basex + b.x * GAME.blocksize, basey + b.y * GAME.blocksize, GAME.blocksize, GAME.blocksize);
        }

    }

    function drawParticles(delta) {
        if (GAME.particles.length > 0) {
            GAME.sweeptimer += delta;
            for (var i = 0; i < GAME.particles.length; i++) {
                GAME.particle_timers[i] += delta;
                if (GAME.particle_timers[i] < 3000) {
                    var p = GAME.particles[i];
                    if (GAME.sweeptimer < GAME.sweeptime) {
                        fire.setCenter({
                            x: (GAME.sweeptimer / GAME.sweeptime) * GAME.blocksize * GAME.width,
                            y: GAME.blocksize / 2 + p * GAME.blocksize
                        });
                        fire.create();
                        fire.create();
                        fire.create();
                        fire.create();
                    }
                }
            }
            fire.update(delta / 1000);
            fire.render();
            if (fire.isEmpty()) {
                GAME.sweeptimer = 0;
                GAME.particles = [];
                GAME.particle_timers = [];
            }
        }
    }

    function drawScore() {
        var basex = GAME.blocksize * GAME.width + GAME.blocksize * 2;
        var basey = GAME.blocksize * 7;
        GAME.context.font = '15px sans-serif';
        GAME.context.fillStyle = getColor(0);
        GAME.context.fillText("Level: " + GAME.level, basex, basey);
        GAME.context.fillText("Rows cleared: " + GAME.lines_cleared, basex, basey + 30);
        GAME.context.fillText("Score: " + GAME.score, basex, basey + 60);
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
        var hit = false;
        for (var i = 0; i < 4; i++) {
            if (block.chunks[i].y == 0) {
                temp[temp.length] = block.chunks[i];
                if (GAME.grid[block.chunks[i].x][block.chunks[i].y] != 0) {
                    hit = true;
                }
            }
        }
        var trycount = 0;
        var can_make = true;
        var dir = ((random(2) - 1 == 0) ? 1 : -1);
        if (hit) {
            for (var t = 0; t < GAME.width; t++) {
                for (var i = 0; i < temp.length; i++) {
                    if (GAME.grid[temp[i].x][temp[i].y] != 0) {
                        for (var j = 0; j < 4; j++) {
                            block.chunks[j].x++;
                            if (block.chunks[j].x >= GAME.width) {
                                for (var k = j; k >= 0; k--) {
                                    block.chunks[k].x--;
                                }
                                for (var k = 0; k < 4; k++) {
                                    block.chunks[k].x -= GAME.width;
                                }
                                moveIntoBoundsHoriz(block);
                                j = 4;
                            }
                        }
                        trycount++;
                        i = temp.length;
                        if (trycount >= GAME.width - 1) {
                            can_make = false;
                        }
                    }
                }
            }
        }
        if (can_make) {
            GAME.pending_block = block;
        } else {
            GAME.over = true;
            GAME.pauseSound("theme");
            GAME.playSound("SFX_GameOver");
        }
    }

    GAME.submitHighScore = function() {
        var name = document.getElementById("id-name-input").value;
        if (name == "") {
            name = "Anonymous";
        }
        var score = GAME.score;
        console.log("Submitting score");
        $.ajax({
            url: 'http://localhost:3000/v1/high-scores?name=' + name + '&score=' + score,
            type: 'POST',
            error: function() {
                alert('POST failed');
            },
            success: function() {
                document.location.href = "../";
            }
        });


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
        var clearcount = 0;
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
                rows[clearcount++] = i;
                GAME.lines_cleared++;
            }
        }

        if (clearcount > 0) {
            var add = 0;
            switch (clearcount) {
                case 1:
                    add = 40 * GAME.level;
                    GAME.playSound("SFX_SpecialLineClearSingle");
                    break;
                case 2:
                    add = 100 * GAME.level;
                    GAME.playSound("SFX_SpecialLineClearDouble");
                    break;
                case 3:
                    add = 300 * GAME.level;
                    GAME.playSound("SFX_SpecialLineClearTriple");
                    break;
                case 4:
                    add = 1200 * GAME.level;
                    GAME.playSound("SFX_SpecialLineClearTriple");
                    break;
            }
            GAME.score += add;
            for (var i = 0; i < clearcount; i++) {
                clearRow(rows[i] + i);
                GAME.particles[GAME.particles.length] = rows[i];
                GAME.particle_timers[GAME.particle_timers.length] = 0;
            }
        }
    }

    function clearRow(r) {
        for (var i = 0; i < GAME.width; i++) {
            GAME.ground[i][r] = 0;
            GAME.grid[i][r] = 0;
        }
        dropGround(r - 1);
    }

    function dropGround(r) {
        var hit = false;
        for (var y = r; y >= 0; y--) {
            for (var x = 0; x < GAME.width; x++) {
                if (GAME.ground[x][y] == 1) {
                    if (y < GAME.height - 1) {
                        GAME.grid[x][y + 1] = GAME.grid[x][y];
                        GAME.ground[x][y + 1] = 1;
                    }
                    GAME.grid[x][y] = 0;
                    GAME.ground[x][y] = 0;
                    if (!hit) {
                        y++;
                        hit = true;
                    }
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