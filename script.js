$(document).ready(function () {
    var WORLD = [];
    var get_ev_coords_on_canvas = function (event, canvas) {
        var coords = canvas.relMouseCoords(event);
        return {
            x: parseInt(coords.x / SIZE),
            y: parseInt(coords.y / SIZE)
        }
    };

    var draw_with_cleanup = function (c, coords, color, delay) {
        c.fillStyle = color;
        c.fillRect(coords.x * SIZE, coords.y * SIZE, SIZE, SIZE);
        setTimeout(function () {
            c.clearRect(coords.x * SIZE, coords.y * SIZE, SIZE, SIZE);
        }, delay)
    };

    var SIZE = 3;
    var ws = new SockJS('http://localhost:8888/ws'),
        $message = $('#message'),
        canvas = document.getElementById('Canvas'),
        canvasOverlay = document.getElementById('CanvasOverlay'),
        ctx = canvas.getContext('2d'),
        overlayCtx = canvasOverlay.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    overlayCtx.imageSmoothingEnabled = false;
    overlayCtx.mozImageSmoothingEnabled = false;

    $('#evolve').click(function (ev) {
        ws.send(JSON.stringify({action: 'evolve'}));
    });
    $('#reset').click(function (ev) {
        ws.send(JSON.stringify({action: 'reset'}));
    });
    $('#start').click(function (ev) {
        ws.send(JSON.stringify({action: 'start'}));
    });
    $('#pause').click(function (ev) {
        ws.send(JSON.stringify({action: 'pause'}));
    });
    $('#random').click(function (ev) {
        ws.send(JSON.stringify({action: 'random'}));
    });

    ws.onopen = function () {
        $message.attr("class", 'label label-success');
        $message.text('open');
    };

    ws.onmessage = function (ev) {
        WORLD = JSON.parse(ev.data);
        redraw_world(WORLD)
    };

    ws.onclose = function (ev) {
        $message.attr("class", 'label label-important');
        $message.text('closed');
    };

    ws.onerror = function (ev) {
        $message.attr("class", 'label label-warning');
        $message.text('error occurred');
    };


    var redraw_world = function (json) {
        var check_canvas_size = function (json) {
            var height = (json.length + 1) * SIZE,
                width = (json[0].length + 1) * SIZE;

            if (
                width == canvas.width &&
                height == canvas.height &&
                width == $(canvas.parentElement).width()
            ) {
                return false
            }
            canvasOverlay.height = canvas.height = height;
            canvasOverlay.width = canvas.width = width;
            $(canvas.parentElement).width(width);

        };

        check_canvas_size(json);
        for (var y = 0; y < json.length; y++) {
            for (var x = 0; x < json[y].length; x++) {
                var is_alive = json[y][x];
                ctx.fillStyle = "#FF0000";
                is_alive ? ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE) : ctx.clearRect(x * SIZE, y * SIZE, SIZE, SIZE)
            }
        }
    };

    $(canvasOverlay).click(function (event) {
        var coords = get_ev_coords_on_canvas(event, canvasOverlay);
        ws.send(JSON.stringify({
            action: 'set_cell',
            data: {
                active: WORLD[coords.y][coords.x] ? 0 : 1,
                x: coords.x,
                y: coords.y
            }

        }));
        var stub = [
            {x: coords.x - 2, y: coords.y},
            {x: coords.x - 1, y: coords.y},
            {x: coords.x + 1, y: coords.y},
            {x: coords.x, y: coords.y + 2},
            {x: coords.x, y: coords.y - 2},
            {x: coords.x, y: coords.y - 1},
            {x: coords.x, y: coords.y + 1},
            {x: coords.x, y: coords.y + 2}
        ];
        _.each(stub, function(coords, num){
            draw_with_cleanup(overlayCtx, coords, "#3AE0E7", 500 + 100 * num);
        });

    });

    $(canvasOverlay).mousemove(function (event) {
        var coords = get_ev_coords_on_canvas(event, canvasOverlay);
        draw_with_cleanup(overlayCtx, coords, "#3AE0E7", 300);
    });
});
