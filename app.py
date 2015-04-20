from functools import partial
import json
import logging
from tornado import websocket, web, ioloop, gen
from logging import getLogger


from game import World, SIMPLE_PLANER
from gardens import parse_garder, BLINKER_SHIP, BUNNIES


log = getLogger(__name__)
logging.basicConfig()
log.setLevel('DEBUG')

clients = []
width = 100
height = 200
INTERVAL = 5


class IndexHandler(web.RequestHandler):
    def get(self):
        log.info(self.request)
        self.render('index.html', width=width, height=height)


class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return self and True

    def on_message(self, message):
        log.info("got message: {0}".format(message))
        data = json.loads(message)
        action = data.get('action')
        data = data.get('data', {})

        if action == 'evolve':
            ioloop.IOLoop.instance().add_callback(evolve_world, world=world, clients=clients)
        if action == 'reset':
            ioloop.IOLoop.instance().add_callback(reset_world, world=world, clients=clients)
        if action == 'set_cell':
            ioloop.IOLoop.instance().add_callback(evolve_world, world=world, clients=clients, mutant_cell=data)
        if action == 'start':
            world.start()
        if action == 'pause':
            world.pause()
        if action == 'random':
            world.populate_random()

    def open(self):
        if self not in clients:
            clients.append(self)
        self.write_message(world.dump_world())

    def on_close(self):
        if self in clients:
            clients.remove(self)


@gen.coroutine
def send_msg(client, msg):
    client.write_message(msg)


@gen.coroutine
def evolve_world(world, clients, mutant_cell=None):
    if mutant_cell:
        world.mutate(mutant_cell)

    world.evolve()

    for client in clients:
        yield send_msg(client, world.dump_world())


@gen.coroutine
def reset_world(world, clients):
    log.info('Reseting world at age: {0}'.format(world.age))
    yield world.reset_world()
    for client in clients:
        yield client.write_message(world.dump_world())


handlers = [
    (r'/', IndexHandler),
    (r'/ws', SocketHandler),
    (r'/static/(.*)', web.StaticFileHandler, {'path': './'}),
]


if __name__ == '__main__':
    app = web.Application(handlers, debug=True, autoreload=True)
    port = 8888
    app.listen(port)
    loop = ioloop.IOLoop.instance()
    world = World(width=width, height=height, alive_cells=SIMPLE_PLANER)
    log.info('Starting world at age {0}, listening at {1}'.format(world.age, port))
    period_cbk = ioloop.PeriodicCallback(partial(evolve_world, world, clients), 100, loop)
    period_cbk.start()
    loop.start()

