from functools import partial
import json
import logging

from tornado import web, ioloop
from sockjs.tornado import SockJSRouter, SockJSConnection

from game import World
from gardens import SIMPLE_PLANER


log = logging.getLogger(__name__)
logging.basicConfig()
log.setLevel('DEBUG')

clients = []
width = 150
height = 70
INTERVAL = 5


def make_msg(type, data):
    return json.dumps({'type': type, 'data': data})


class IndexHandler(web.RequestHandler):
    def get(self):
        log.info(self.request)
        self.render('templates/index.html', width=width, height=height)


class SocketHandler(SockJSConnection):
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

    def on_open(self, info):
        if self not in clients:
            clients.append(self)
        self.send(make_msg('world', world.dump_world()))
        self.broadcast(clients, make_msg('users', len(clients)))

    def on_close(self):
        if self in clients:
            clients.remove(self)
        self.broadcast(clients, make_msg('users', len(clients)))


def send_msg(client, msg):
    client.send(msg)


def evolve_world(world, clients, mutant_cell=None):
    if mutant_cell:
        world.mutate(mutant_cell)

    world.evolve()
    clients and clients[0].broadcast(clients, make_msg('world', world.dump_world()))


def reset_world(world, clients):
    log.info('Reseting world at age: {0}'.format(world.age))
    world.reset_world()
    for client in clients:
        client.send(make_msg('world', world.dump_world()))


handlers = [
    (r'/', IndexHandler),
    (r'/static/(.*)', web.StaticFileHandler, {'path': './static/'}),
] + SockJSRouter(SocketHandler, '/ws').urls


if __name__ == '__main__':
    app = web.Application(handlers, debug=True, autoreload=True)
    port = 8888
    app.listen(port)
    loop = ioloop.IOLoop.instance()
    world = World(width=width, height=height, alive_cells=SIMPLE_PLANER)
    log.info('Starting world at age {0}, listening at {1}'.format(world.age, port))
    period_cbk = ioloop.PeriodicCallback(partial(evolve_world, world, clients), 250, loop)
    period_cbk.start()
    loop.start()

