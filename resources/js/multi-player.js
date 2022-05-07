// define
const clientVersion = 6.0
var ws = new WebSocket('wss://api.oggyp.com/ws/snake');
var game_start = false;
var player_no = 0;
var direction = []
var vectorAmt = 1;
var debug = false;
WS_Message = {}
var ctx;
const green = "rgb(0,255,0)"
const blue = "rgb(0,142,255)"
const red = "rgb(255,0,0)"
const orange = "rgb(255,119,0)"
const purple = "rgb(128,14,243)"
var current_game;
var randMovement = false;
var errorPageEdited = false;

let lastGame = {}


class snake {
    constructor(head, colour, direction, id) {
        this.colour = colour
        this.snake_body = []
        this.snake_head = head
        this.direction = direction
        this.id = id;
        this.dead = false
    }
}

class game {
    constructor(food, mode) {
        this.mode = mode
        this.food = food
        this.snake1 = new snake([0, 0], green, [0, 1], 'player1')
        this.snake2 = new snake([x_box_amount - 1, y_box_amount - 1], blue, [0, -1], 'player2')
        if (mode > 2) {
            this.snake3 = new snake([0, y_box_amount - 1], orange, [0, -1], 'player3')
        }
        if (mode > 3) {
            this.snake4 = new snake([x_box_amount - 1, 0], purple, [0, 1], 'player4')
        }
    }
}

audio = {}


audio['death'] = new Audio("/sound_effects/death.wav");
audio['eat'] = new Audio("/sound_effects/eat.wav");
audio['game_found'] = new Audio("/sound_effects/game_found.wav");

if (!checkSupported()) {
    alert('This web browser is not supported!');
}

var canvas = document.getElementById('canvas');

var x_box_amount = 160
var y_box_amount = 75

var screen_width = $(window).width();
var screen_height = $(window).height() - 70;

var box_size = Math.floor(Math.min(screen_width / x_box_amount, screen_height / y_box_amount))

console.log('Box Size ' + box_size + 'px')

//width="400" height="300"
canvas.setAttribute('width', x_box_amount * box_size);
canvas.setAttribute('height', y_box_amount * box_size);
canvas.style.width = x_box_amount * box_size;
canvas.style.height = y_box_amount * box_size;

ctx = canvas.getContext('2d')

$('#game').hide();
$('#requeue-btn').hide();
$('.hide').hide();
$('#loading-login').show();
$('#loading').hide();
$('#account-wrapper').hide();
$('#countdown').hide();


// Deal with keyboard input
window.addEventListener("keydown", function(event) {
    if (game_start) {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }

        if (randMovement) {
            vectorAmt = Math.floor(Math.random() * 200) / 200;
        }

        var key_press = false

        if ((event.key === "ArrowDown" || event.key === "s") && key_press === false) {
            direction = [0, vectorAmt];
            send_one(ws, 'movement', direction, [])
            key_press = true
        }
        if ((event.key === "ArrowUp" || event.key === "w") && key_press === false) {
            direction = [0, -vectorAmt];
            send_one(ws, 'movement', direction, [])
            key_press = true
        }
        if ((event.key === "ArrowLeft" || event.key === "a") && key_press === false) {
            direction = [-vectorAmt, 0];
            send_one(ws, 'movement', direction, [])
            key_press = true
        }
        if ((event.key === "ArrowRight" || event.key === "d") && key_press === false) {
            direction = [vectorAmt, 0];
            send_one(ws, 'movement', direction, [])
            key_press = true
        }
    } else {
        if (event.key === " ") {
            requeue()
        }
    }
}, true);


// Deal with touch input
window.addEventListener("touchstart", function(e) {
    if (game_start && e.touches) {
        let center = {
            'x': $(window).width() / 2,
            'y': $(window).height() / 2
        };
        let touchCoords = {
            'x': e.touches[0].clientX,
            'y': e.touches[0].clientY
        };
        let distFromCenter = {
            'x': touchCoords.x - center.x,
            'y': touchCoords.y - center.y
        }

        if (Math.abs(distFromCenter.x) > Math.abs(distFromCenter.y)) {
            /* Horizontal */

            if (touchCoords.x > center.x) {
                // Right
                direction = [vectorAmt, 0];
                send_one(ws, 'movement', direction, []);
            } else {
                // Left
                direction = [-vectorAmt, 0];
                send_one(ws, 'movement', direction, []);
            }
        } else {
            /* Vertical */

            if (touchCoords.y > center.y) {
                // Down
                direction = [0, vectorAmt];
                send_one(ws, 'movement', direction, []);
            } else {
                // Up
                direction = [0, -vectorAmt];
                send_one(ws, 'movement', direction, []);
            }
        }

        e.preventDefault();
    }
}, true);



// On resize
window.addEventListener("resize", function() {
    screen_width = $(window).width();
    screen_height = $(window).height() - 70;

    box_size = Math.floor(Math.min(screen_width / x_box_amount, screen_height / y_box_amount))

    console.log('Box Size ' + box_size + 'px')

    //width="400" height="300"
    canvas.setAttribute('width', x_box_amount * box_size);
    canvas.setAttribute('height', y_box_amount * box_size);
    canvas.style.width = x_box_amount * box_size;
    canvas.style.height = y_box_amount * box_size;

    if (game_start) {
        drawRect(ctx, current_game.food[0], current_game.food[1], box_size, red)
        all_snakes = [current_game.snake1, current_game.snake2]
        if (current_game.mode > 2) {
            all_snakes.push(current_game.snake3)
        }
        if (current_game.mode > 3) {
            all_snakes.push(current_game.snake4)
        }
        all_snakes.forEach(snakeToDraw => {
            snakeToDraw.snake_body.forEach(cell => {
                drawRect(ctx, cell[0], cell[1], box_size, snakeToDraw.colour)
            })
            drawRect(ctx, snakeToDraw.snake_head[0], snakeToDraw.snake_head[1], box_size, snakeToDraw.colour)
        })
    }
});

// event emmited when connected
ws.onopen = function() {
    console.log('Web Socket Connected')
    checkForToken()
    $('#account-wrapper').show();
    $('#loading-login').hide();
}

// event emmited when connected
ws.onclose = function() {
    if (!errorPageEdited) {
        error("Disconnected from OggyP Snake Server", "Try reloading the page. (Server Closed 11:30pm - 6:30am. Buy me a better server if you want it to run 24/7)")
    }
}

// event emmited when connected
ws.onerror = function() {
    error("Server Connection Error", "Try reloading the page or try again later.")
}

// event emitted when receiving message
ws.onmessage = function(ev) {
    // receive message
    try {
        const message = JSON.parse(ev.data);

        if (debug) {
            console.log(message)
        }

        if (message.type === 'match') {
            if (message.content === 'player wait') {
                $('#game-code').hide()
                $('#game-select').hide();
                $('#loading').show();
            } else if (message.content === 'private match wait') {
                $('#game-select').hide();
                $('#loading').show();
                $('#game-code').show()
                $('#game-code').val('')
                $('#game-code').text('Game Code: ' + message.code)
            } else if (message.content === 'found') {
                var player_list = ['player1', 'player2']
                if (message.mode > 2) {
                    player_list.push('player3')
                } else {
                    $('.player3-info').hide()
                }

                if (message.mode > 3) {
                    player_list.push('player4')
                } else {
                    $('.player4-info').hide()
                }

                if (message.mode === 3) {
                    var ratingToCheck = 'rating3'
                } else {
                    var ratingToCheck = 'rating2'
                }

                player_list.forEach(player => {
                    const player_about = JSON.parse(message[player])
                    $('.' + player + '-info').show()
                    $('#' + player + '-username').text(player_about.username)
                    if (message.mode !== 3 && player_about.rd2 > 200) {
                        $('#' + player + '-rating').text(Math.round(player_about[ratingToCheck]) + '?')
                    } else {
                        $('#' + player + '-rating').text(Math.round(player_about[ratingToCheck]))
                    }
                    $('#' + player + '-length').text(0)

                    // deal with titles
                    const playerTitle = $('#' + player + '-title')
                    if (player_about.title === '') {
                        playerTitle.hide()
                    } else {
                        playerTitle.show()
                        playerTitle.text(player_about.title + " ")
                    }
                });

                $('#loading').hide();
                $('#game-select').hide();
                $('#game').show();

                audio['game_found'].play()
                drawRect(ctx, 0, 0, box_size, green)
                drawRect(ctx, x_box_amount - 1, y_box_amount - 1, box_size, blue)
                if (message.mode > 2) {
                    drawRect(ctx, 0, y_box_amount - 1, box_size, orange)
                }
                if (message.mode > 3) {
                    drawRect(ctx, x_box_amount - 1, 0, box_size, purple)
                }
                player_no = message.player;
                current_game = new game(message.food, message.mode)
                drawRect(ctx, message.food[0], message.food[1], box_size, red)
            }
        } else if (message.type === 'countdown') {
            if (message.content === 0) {
                $('#countdown').hide()
                game_start = true
                send_one(ws, 'movement', direction, [])
            } else {
                $('#countdown').show();
                if (player_no === 1) {
                    direction = [0, 1]
                    $('#countdown').html('<h1>' + Math.ceil(message.content / 5) + ' <span class="player1">YOU ARE GREEN</span>' + '</h1>');
                    $('html').addClass('green-background')
                } else if (player_no === 2) {
                    direction = [0, -1]
                    $('#countdown').html('<h1>' + Math.ceil(message.content / 5) + ' <span class="player2">YOU ARE BLUE</span>' + '</h1>');
                    $('html').addClass('blue-background')
                } else if (player_no === 3) {
                    direction = [0, -1]
                    $('#countdown').html('<h1>' + Math.ceil(message.content / 5) + ' <span class="player3">YOU ARE ORANGE</span>' + '</h1>');
                    $('html').addClass('orange-background')
                } else if (player_no === 4) {
                    direction = [0, 1]
                    $('#countdown').html('<h1>' + Math.ceil(message.content / 5) + ' <span class="player5">YOU ARE PURPLE</span>' + '</h1>');
                    $('html').addClass('purple-background')
                }

            }
        } else if (message.type === 'game') {
            if (message.hasOwnProperty('food')) {
                current_game.food = message.food
                drawRect(ctx, current_game.food[0], current_game.food[1], box_size, red)
                audio['eat'].play()
            }

            const snakes = [current_game.snake1, current_game.snake2]
            if (current_game.mode > 2) {
                snakes.push(current_game.snake3)
            }
            if (current_game.mode > 3) {
                snakes.push(current_game.snake4)
            }
            // FOR EACH GAME TICK
            snakes.forEach(current_snake => {
                if (!current_snake.dead) {
                    current_snake.dead = message[current_snake.id][2]
                    current_snake.direction = message[current_snake.id][0]
                    current_snake.snake_body.push(current_snake.snake_head.slice())
                    current_snake.snake_head = [current_snake.snake_head[0] + current_snake.direction[0], current_snake.snake_head[1] + current_snake.direction[1]]
                    if (message[current_snake.id][1] === current_snake.snake_body.length - 1) {
                        let dead_cell = current_snake.snake_body.shift()
                        clearRect(ctx, dead_cell[0], dead_cell[1], box_size)
                    } else {
                        $('#' + current_snake.id + '-length').text(message[current_snake.id][1])
                    }
                }
            });
            snakes.forEach(current_snake => {
                if (!current_snake.dead) {
                    drawRect(ctx, current_snake.snake_head[0], current_snake.snake_head[1], box_size, current_snake.colour)
                }
            });
        } else if (message.type === 'game alert') {
            $('#countdown').show()
            $('#countdown').html('<h1>' + message.content + '</h1>')
        } else if (message.type === 'end') {
            audio['death'].play()
            $('#countdown').show()
            $('#countdown').html('<h1>' + message.content + '</h1>')
            setTimeout(function() {
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                $('#game-select').show();
                $('#game').hide();
                $('#loading').hide();
                $('#countdown').hide();
                $('html').removeClass();
                send_one(ws, 'rating', null, [])
                current_game = null
                direction = []
                game_start = false
                player_no = 0
            }, 3000);
        } else if (message.type === 'login') {
            if (message.content === 'success') {
                if (message.hasOwnProperty("token")) {
                    setCookie("token", message.token + "|" + message.userID, 7)
                }
                $('#username').text(message.username)
                $('#loading-login').hide();
                $('#account-wrapper').fadeOut();
                $('#game-select').animate({
                    opacity: 1
                });
                send_one(ws, 'rating', null, [])
                send_one(ws, 'rating3', null, [])
            } else if (message.content === 'fail') {
                $('#login-error').text(message.reason)
            }
        } else if (message.type === 'register') {
            if (message.content === 'success') {
                hideRegister();
            } else if (message.content === 'fail') {
                $('#register-error').text(message.reason)
            }
        } else if (message.type === 'rating') {
            if (message.reliable) {
                $('#2-player-rating').text("(" + Math.round(message.content) + ")")
            } else {
                $('#2-player-rating').text("(" + Math.round(message.content) + "?)")
            }
            $('#3-player-rating').text("(" + Math.round(message.rating3) + ")")
        } else if (message.type === 'queuingPlayers') {
            $("#player-list").empty();
            $("#player-list-title").text("Players Queuing (" + message.content.length + "/" + message.maxPlayers + "):");
            message.content.forEach(username => {
                $("#player-list").append("<li class=\"player-username\">" + username + "</li>")
            })
        } else if (message.type === 'logout') {
            window.location.reload(true)
        } else if (message.type === 'gameVersion') {
            if (Math.floor(message.content) !== Math.floor(clientVersion) && getCookie("dev") === "") {
                error("You are running an incompatible version of snake!", "Client Version: " + clientVersion + " | Server Version: " + message.content + " | Try force reloading the page.")
                    // console.log("Attempting auto reload.")
                    // window.location.reload(true)
            } else {
                console.log("Network Compatible")
            }
            console.log("Server Version: " + message.content)
            console.log("Client Version: " + clientVersion)
        } else if (message.type === 'error') {
            error(message.content, "Try reloading the page.")
            errorPageEdited = true;
        }
    } catch (e) {
        console.log(e)
    }
}

function home() {
    send_one(ws, 'match', 'stop search', [])
    $('#game-select').show();
    $('#game').hide();
    $('#loading').hide();
    $('#countdown').hide();
    $('html').removeClass();
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkForToken() {
    let token = getCookie("token");
    if (token !== "") {
        console.log(token)
        send_one(ws, "token", token, [])
    }
}

function register() {
    if ($('#password-register-verify').val() === $('#password-register').val()) {
        send_one(ws, 'register', $('#username-register').val(), [
            ['password', $('#password-register').val()]
        ])
    } else {
        $('#register-error').text('Passwords do not match')
    }
}

function login() {
    send_one(ws, 'login', $('#username-input').val(), [
        ['password', $('#password-input').val()]
    ])
}

function send_one(ws, type, content, meta) {
    for (var member in WS_Message) delete WS_Message[member];
    if (meta.length > 0) {
        meta.forEach(element => {
            // element [name, thingo]
            WS_Message[element[0]] = element[1];
        });
    }
    WS_Message.type = type;
    WS_Message.content = content;
    ws.send(JSON.stringify(WS_Message));
}

function checkSupported() {
    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        return true
            // Canvas is supported
    } else {
        // Canvas is not supported
        alert("We're sorry, but your browser does not support the canvas tag. Please use any web browser other than Internet Explorer.");
        return false
    }
}

function experimental() {
    $('.hide').show()
    return "success";
}

function drawRect(canvas, x, y, box_size, colour) {
    canvas.fillStyle = colour;
    canvas.fillRect(x * box_size, y * box_size, box_size, box_size);
}

function clearRect(canvas, x, y, box_size) {
    canvas.clearRect(x * box_size, y * box_size, box_size, box_size);
}

function requeue() {
    send_one(ws, 'match', 'random', [
        ['mode', lastGame.mode]
    ])
    $('#game-type').text(lastGame.text)
}

function logout() {
    if (getCookie("token") !== "") {
        send_one(ws, 'logout', '', [
            ["token", getCookie("token")]
        ])
    }

    deleteCookie("token")
}

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=None;Secure';
}

function showGame() {
    audio['game_found'].play()
    $('#player2-title').text('Kaelan is cool');
    $('#player1-title').text('Oscar is cool');
    $('#login').hide();
    $('#loading').hide();
    $('#game-select').hide();
    $('#game').show();
}

function cheat(amt) {
    if (amt !== "rand") {
        vectorAmt = amt;
        return "Ok mr hacker, you are moving " + amt + " blocks."
    } else {
        randMovement = true;
        return "Ok mr hacker, you are moving a random amount of blocks."
    }
}

function btnClicked(mode, text) {
    send_one(ws, 'match', 'random', [
        ['mode', mode]
    ])
    $('#game-type').text(text)
    lastGame.mode = mode
    lastGame.text = text
    $('#requeue-name').text("Requeue: " + text)
    $('#requeue-btn').show()
}

function error(message1, message2) {
    $('#game').hide();
    $('.hide').hide();
    $('#loading').hide();
    $('#account-wrapper').hide();
    $('#game-code').hide()
    $('#game-select').hide();
    $('#countdown').hide();
    $('#loading1').text(message1)
    $('#loading2').text(message2)
    $('#loading-login').show();
}