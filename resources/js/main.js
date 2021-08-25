function checkSupported() {
    var canvas = document.getElementById('canvas');
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        return true
        // Canvas is supported
    } else {
        // Canvas is not supported
        alert("We're sorry, but your browser does not support the canvas tag. Please use any web browser other than Internet Explorer.");
        return false
    }
}

function documentLoad() {
    if (!checkSupported()) {
        return
    }

    var canvas = document.getElementById('canvas');

    canvas.style.width = 1000

    var x_box_amount = 160
    var y_box_amount = 90

    var screen_width = $(window).width();
    var screen_height = $(window).height() - 10;

    var box_size = Math.floor(Math.min(screen_width / x_box_amount, screen_height / y_box_amount))

    console.log('Box Size ' + box_size + 'px')

    //width="400" height="300"
    canvas.setAttribute('width', x_box_amount * box_size);
    canvas.setAttribute('height', y_box_amount * box_size);
    canvas.style.width = x_box_amount * box_size;
    canvas.style.height = y_box_amount * box_size;

    var ctx = canvas.getContext('2d');

    let snake = [];
    let snake_head = [0, 0];
    let direction = [0, 1];
    let old_direction = [0, 1];
    let cell_to_clear = [0, 0];
    let food = [getRndInteger(0, x_box_amount - 1), getRndInteger(0, y_box_amount - 1)]
    let food_cool_down = 0;

    // Deal with keyboard input
    window.addEventListener("keydown", function (event) {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }

        switch (event.key) {
            case "ArrowDown":
                if (JSON.stringify(old_direction) !== JSON.stringify([0, -1])) {
                    direction = [0, 1];
                    return;
                }
                return;
            case "ArrowUp":
                if (JSON.stringify(old_direction) !== JSON.stringify([0, 1])) {
                    direction = [0, -1];
                    return;
                }
                return;
            case "ArrowLeft":
                if (JSON.stringify(old_direction) !== JSON.stringify([1, 0])) {
                    direction = [-1, 0];
                    return;
                }
                return;
            case "ArrowRight":
                if (JSON.stringify(old_direction) !== JSON.stringify([-1, 0])) {
                    direction = [1, 0];
                    return;
                }
                return;
            default:
                return;
        }

        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }, true);

    drawRect(ctx, food[0], food[1], box_size, "rgb(255,0,0)")

    // Game Loop
    setInterval(function(){

        snake.push(snake_head.slice());

        snake_head[0] = snake_head[0] + direction[0];
        snake_head[1] = snake_head[1] + direction[1];
        old_direction = direction.slice()

        if (snake_head[0] === food[0] && snake_head[1] === food[1]) {
            while (in2Darray(snake, food) || (snake_head[0] === food[0] && snake_head[1] === food[1])) {
                food = [getRndInteger(0, x_box_amount - 1), getRndInteger(0, y_box_amount - 1)]
            }
            console.log('Food ' + food)
            drawRect(ctx, food[0], food[1], box_size, "rgb(255,0,0)")
            food_cool_down += 5
        }

        if (food_cool_down === 0) {
            cell_to_clear = snake.shift()
            clearRect(ctx, cell_to_clear[0], cell_to_clear[1], box_size)
        } else {
            food_cool_down --
        }

        if (in2Darray(snake, snake_head)) {
            alert('You can\'t hit into yourself stupid')
        }
        snake.forEach(cell => {
            if (JSON.stringify(cell) === JSON.stringify(snake_head)) {
                alert('You can\'t hit into yourself stupid')
                window.location.reload(true)
            }
        });

        if (snake_head[0] < 0 || snake_head[0] > x_box_amount - 1 || snake_head[1] < 0 || snake_head[1] > y_box_amount - 1) {
            alert('Don\'t go off the edge of the screen stupid')
            window.location.reload(true)
        }

        drawRect(ctx, snake_head[0], snake_head[1], box_size, "rgb(0,255,0)")
    }, 100);//Delay 0.5 seconds
}




function drawRect(canvas, x, y, box_size, colour) {
    canvas.fillStyle = colour;
    canvas.fillRect(x * box_size, y * box_size, box_size, box_size);
}

function clearRect(canvas, x, y, box_size) {
    canvas.clearRect(x * box_size, y * box_size, box_size, box_size);
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function in2Darray(arr1, arr2) {
    arr1.forEach(item => {
        if (JSON.stringify(item) === JSON.stringify(arr2)) {
            return true;
        }
    });
    return false;
}