$(document).ready(function () {
    var SIZE = 3;
    var ws = new WebSocket('ws://localhost:8888/ws'),
        $message = $('#message'),
        canvas = document.getElementById('Canvas'),
        ctx = canvas.getContext('2d');

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
        canvas.height = (json.length + 1) * SIZE;
        canvas.width = (json[0].length + 1) * SIZE;
        for (var y = 0; y < json.length; y++) {
            for (var x = 0; x < json.length; x++) {
                var is_alive = json[y][x];
                ctx.fillStyle = "#FF0000";
                is_alive ? ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE) : ctx.clearRect(x * SIZE, y * SIZE, SIZE, SIZE)
            }
        }
    };


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
