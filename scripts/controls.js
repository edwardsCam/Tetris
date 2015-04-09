function addControl() {

    var name, key;

    for (var i = 0; i < 6; i++) {
        switch (i) {
            case 0:
                name = "left";
                key = document.getElementById("id-left").value.charCodeAt(0) - 32;
                break;
            case 1:
                name = "right";
                key = document.getElementById("id-right").value.charCodeAt(0) - 32;
                break;
            case 2:
                name = "counterclock";
                key = document.getElementById("id-counterclockwise").value.charCodeAt(0) - 32;
                break;
            case 3:
                name = "clock";
                key = document.getElementById("id-clockwise").value.charCodeAt(0) - 32;
                break;
            case 4:
                name = "soft";
                key = document.getElementById("id-softdrop").value.charCodeAt(0) - 32;
                break;
            case 5:
                name = "hard";
                key = document.getElementById("id-harddrop").value.charCodeAt(0) - 32;
                break;
        }
        $.ajax({
            url: 'http://localhost:3000/v1/controls?name=' + name + '&key=' + key,
            type: 'PUT',
            error: function() {
                alert('PUT failed');
            },
            success: function() {
                showControls();
            }
        });
    }

}

function showControls() {
    $.ajax({
        url: 'http://localhost:3000/v1/controls',
        cache: false,
        type: 'GET',
        error: function() {
            alert('GET failed');
        },
        success: function(data) {
            var elem;
            for (var value = 0; value < data.length; value++) {
                switch (value) {
                    case 0:
                        elem = document.getElementById("id-left");
                        break;
                    case 1:
                        elem = document.getElementById("id-right");
                        break;
                    case 2:
                        elem = document.getElementById("id-counterclockwise");
                        break;
                    case 3:
                        elem = document.getElementById("id-clockwise");
                        break;
                    case 4:
                        elem = document.getElementById("id-softdrop");
                        break;
                    case 5:
                        elem = document.getElementById("id-harddrop");
                        break;
                }
                elem.value = String.fromCharCode(32 + parseInt(data[value].key));
            }
        }
    });
}


var canvas = document.getElementById('canvas-menu'),
    ctx = canvas.getContext('2d');

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


(function() {

    showControls();

    // mouse event variables
    var mousePosition = {
        x: 0,
        y: 0
    };
    var mousePressed = false;

    /**
     * Track the user's mouse position on mouse move.
     * @param {Event} event
     */
    canvas.addEventListener('mousemove', function(event) {
        mousePosition.x = event.offsetX || event.layerX;
        mousePosition.y = event.offsetY || event.layerY;
    });

    /**
     * Track the user's clicks.
     * @param {Event} event
     */
    canvas.addEventListener('mousedown', function(event) {
        mousePressed = true;
    });
    canvas.addEventListener('mouseup', function(event) {
        mousePressed = false;
    });

    /**
     * A button with hover and active states.
     * @param {integer} x     - X coordinate of the button.
     * @param {integer} y     - Y coordinate of the button.
     * @param {integer} w     - Width of the button.
     * @param {integer} h     - Height of the button.
     * @param {string}  text  - Text on the button.
     * @param {object}  colors - Default, hover, and active colors.
     *
     * @param {object} colors.default - Default colors.
     * @param {string} colors.default.top - Top default button color.
     * @param {string} colors.default.bottom - Bottom default button color.
     *
     * @param {object} colors.hover - Hover colors.
     * @param {string} colors.hover.top - Top hover button color.
     * @param {string} colors.hover.bottom - Bottom hover button color.
     *
     * @param {object} colors.active - Active colors.
     * @param {string} colors.active.top - Top active button color.
     * @param {string} colors.active.bottom - Bottom active button color.
     *
     * @param {function} action - The funciton to call when the button is clicked.
     */
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
            ctx.save();

            var colors = this.colors[this.state];
            var halfH = this.height / 2;

            // button
            ctx.fillStyle = colors.top;
            ctx.fillRect(this.x, this.y, this.width, halfH);
            ctx.fillStyle = colors.bottom;
            ctx.fillRect(this.x, this.y + halfH, this.width, halfH);

            // text
            var size = ctx.measureText(this.text);
            var x = this.x + (this.width - size.width) / 2;
            var y = this.y + (this.height - 15) / 2 + 12;

            ctx.fillStyle = '#FFF';
            ctx.font = '15px sans-serif';
            ctx.fillText(this.text, x, y);

            ctx.restore();
        };
    }

    var bw = 200,
        bh = 50;

    var default_colors = {
        'default': all_colors[0],
        'hover': all_colors[1],
        'active': all_colors[2]
    };

    var saveButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 - 100, bw, 50, 'Save', default_colors,
            function() {
                addControl();
            }),
        backButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 - 25, bw, 50, 'Exit', default_colors,
            function() {
                document.location.href = "../";
            });

    function animate() {
        requestAnimationFrame(animate);

        ctx.font = '30px sans-serif';
        ctx.fillText("Controls", canvas.width / 2 - 50, 50);
        backButton.update();
        backButton.draw();

        saveButton.update();
        saveButton.draw();
    }

    requestAnimationFrame(animate);
})();