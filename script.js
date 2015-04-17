$(document).ready(function () {
    var ws = new WebSocket('ws://localhost:8888/ws'),
        $message = $('#message'),
        $evolve_btn = $('#evolve'),
        $reset_btn = $('#reset');

    $evolve_btn.click(function (ev) {
        ws.send(JSON.stringify({action: 'evolve'}));
    });
    $reset_btn.click(function (ev) {
        ws.send(JSON.stringify({action: 'reset'}));
    });

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
        $('#world').remove();

        var cell_template = _.template('<td class="cell <%= active %>" data-x="<%= x %>" data-y="<%= y %>">'),
            $world = $('<table id="world">');

        for (var y = 0; y < json.length; y++) {
            var $row = $('<tr>');
            for (var x = 0; x < json.length; x++) {
                $row.append($(cell_template({
                    active: json[y][x] ? 'active' : '',
                    x: x,
                    y: y
                })))
            }
            $world.append($row)
        }
        $('.container').append($world)
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
