import json

ALIVE = 1
DEAD = 0
SIMPLE_PLANER = [(4, 1), (2, 2), (4, 2), (3, 3), (4, 3)]


class World(object):
    def __init__(self, width=10, height=10, alive_cells=None):
        self.width = width
        self.height = height
        self.age = 0
        self.initial_active_cells = alive_cells or []
        self.cells = []
        self._populate()

    def _populate(self):
        self.cells = [([0] * self.width) for _ in range(self.height)]
        for cell in self.initial_active_cells:
            self.cells[cell[0]][cell[1]] = 1

    def _get_siblings(self, x, y):
        return [
            (_x, _y)
            for _x in [x + 1, x - 1, x]
            for _y in [y + 1, y - 1, y]
            if (_x != x or _y != y) and 0 <= _x < self.width and 0 <= _y < self.height
        ]

    def _decide_fate(self, cell, cell_num, row_num):
        num_alive_siblings = len(filter(bool, [self.cells[y][x] for (x, y) in self._get_siblings(cell_num, row_num)]))
        if (cell is not ALIVE and num_alive_siblings is 3) or (cell is ALIVE and 2 <= num_alive_siblings <= 3):
            return ALIVE
        else:
            return DEAD

    def evolve(self):
        new_world = []
        for row_num, row in enumerate(self.cells):
            new_world.append([self._decide_fate(cell, cell_num, row_num) for cell_num, cell in enumerate(row)])
        self.cells = new_world
        self.age += 1

    def dump_world(self):
        return json.dumps(self.cells)

    def reset_world(self):
        self._populate()