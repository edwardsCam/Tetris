// Derived from sample code taken from http://blog.sklambert.com/html5-game-tutorial-game-ui-canvas-vs-dom/

            var canvas = document.getElementById('canvas-menu'),
                ctx = canvas.getContext('2d');

            window.onload = function() {
                var logo = new Image();
                logo.onload = function() {
                    ctx.drawImage(logo, canvas.width / 2 - 250, canvas.height / 4 - 100);
                };
                logo.src = "img/logo.jpg";
            };

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

                ctx.font = '15px sans-serif';

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

                var playButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 - 25, bw, 50, 'New Game', default_colors,
                        function() {
                            document.location.href = "maingame.html";
                        }),
                    hsButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 + 50, bw, 50, 'High Scores', default_colors,
                        function() {
                            //todo
                        }),
                    controlsButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 + 125, bw, 50, 'Controls', default_colors,
                        function() {
                            //todo
                        }),
                    credButton = new Button(canvas.width / 2 - bw / 2, canvas.height / 2 + 200, bw, 50, 'Credits', default_colors,
                        function() {
                            //todo
                        });

                function animate() {
                    requestAnimationFrame(animate);
                    playButton.update();
                    playButton.draw();

                    hsButton.update();
                    hsButton.draw();

                    controlsButton.update();
                    controlsButton.draw();

                    credButton.update();
                    credButton.draw();
                }

                requestAnimationFrame(animate);
            })();