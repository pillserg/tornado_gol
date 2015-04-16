from tornado import websocket, web, ioloop
from logging import getLogger

from game import World, SIMPLE_PLANER


log = getLogger(__name__)
log.setLevel('DEBUG')

clients = []
width = height = 10
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
        if message == 'evolve':
            ioloop.IOLoop.instance().add_callback(evolve_world, world=world, clients=clients)
        if message == 'reset':
            ioloop.IOLoop.instance().add_callback(reset_world, world=world, clients=clients)

    def open(self):
        if self not in clients:
            clients.append(self)
        self.write_message(world.dump_world())

    def on_close(self):
        if self in clients:
            clients.remove(self)


def evolve_world(world, clients):
    log.info('Evolving world, age: {0}'.format(world.age))
    world.evolve()
    for client in clients:
        client.write_message(world.dump_world())


def reset_world(world, clients):
    log.info('Reseting world, age: {0}'.format(world.age))
    world.reset_world()
    for client in clients:
        client.write_message(world.dump_world())


handlers = [
    (r'/', IndexHandler),
    (r'/ws', SocketHandler),
    (r'/(favicon.ico)', web.StaticFileHandler, {'path': '../'}),
    (r'/(rest_api_example.png)', web.StaticFileHandler, {'path': './'})
]


if __name__ == '__main__':
    app = web.Application(handlers)
    app.listen(8888)
    world = World(width=width, height=height, alive_cells=SIMPLE_PLANER)
    ioloop.IOLoop.instance().start()
