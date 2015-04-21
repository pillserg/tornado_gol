$(document).ready(function () {

    var get_ev_coords_on_canvas = function(event, canvas){
        var coords = canvas.relMouseCoords(event);
        return {
            x: parseInt(coords.x / SIZE),
            y: parseInt(coords.y / SIZE)
        }
    };

    var draw_with_cleanup = function(c, color, delay){
        
    };


    var SIZE = 3;
    var ws = new SockJS('http://localhost:8888/ws'),
        $message = $('#message'),
        canvas = document.getElementById('Canvas'),
        canvasOverlay = document.getElementById('CanvasOverlay'),
        ctx = canvas.getContext('2d');
        overlayCtx = canvasOverlay.getContext('2d');

    $('#evolve').click(function (ev) {ws.send(JSON.stringify({action: 'evolve'}));});
    $('#reset').click(function (ev) {ws.send(JSON.stringify({action: 'reset'}));});
    $('#start').click(function (ev) {ws.send(JSON.stringify({action: 'start'}));});
    $('#pause').click(function (ev) {ws.send(JSON.stringify({action: 'pause'}));});
    $('#random').click(function (ev) {ws.send(JSON.stringify({action: 'random'}));});

    ws.onopen = function () {
        $message.attr("class", 'label label-success');
        $message.text('open');
    };

    ws.onmessage = function (ev) {
        redraw_world(JSON.parse(ev.data))
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
        var check_canvas_size = function(json){
            var height = (json.length + 1) * SIZE,
                width = (json[0].length + 1) * SIZE;

            if (width == canvas.width && height == canvas.height){
                return false
            }
            canvasOverlay.height = canvas.height = height;
            canvasOverlay.width = canvas.width = width;
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

    $(canvasOverlay).click(function(event){
        console.log(get_ev_coords_on_canvas(event, canvasOverlay))
    });

    $(canvasOverlay).mousemove(function(event){
        var coords = get_ev_coords_on_canvas(event, canvasOverlay);
        overlayCtx.fillStyle = "#3AE0E7";
        overlayCtx.fillRect(coords.x * SIZE, coords.y * SIZE, SIZE, SIZE);
        setTimeout(function(){
            overlayCtx.clearRect(coords.x * SIZE, coords.y * SIZE, SIZE, SIZE);
        }, 300)
    });

    $('body').on('click', '#world .cell', function (ev) {
        var $cell = $(this);
        ws.send(JSON.stringify({
            action: 'set_cell',
            data: {
                active: $cell.hasClass('active') ? 0 : 1,
                x: $cell.data().x,
                y: $cell.data().y
            }

        }))
    });
});
