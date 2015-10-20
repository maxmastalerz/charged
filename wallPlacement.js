var m = require('./methods.js');

function playersNearbySpawn(g, room, wallY, wallX) {
	for(var username in g.rooms[room].players) {
		var iteratedClient = m.clientFromUsername(g, username);
		if(m.dist(iteratedClient.xPos,iteratedClient.yPos,wallX,wallY)<5) {
			return true;
		}
	}
}

function scheduleDespawn(g, room, c, wallY, wallX) {
	setTimeout(function() {
		if(g.rooms[room]!==undefined) {
			if(playersNearbySpawn(g, room, wallY, wallX)) {
				scheduleDespawn(g, room, c, wallY,wallX);
			} else if(g.rooms[room].map[wallY][wallX].type==='wall') {
				g.rooms[room].map[wallY][wallX] = {type: 'air'};
				m.updateMiniMapsInRoom(g, room);
				c.wallsInUse--;
				c.emit('updateWallsInUse', c.wallsInUse);
				m.updateMiniMapsInRoom(g, room);
			}
		}
	}, 7000);	//delay between trying to despawn the wall placed
}

function canPlaceWall(c) {
	if(c.room!==undefined && c.entityUnderneath===null && c.wallsInUse<3) {
		return true;
	}
}

module.exports = function(g, c) {
	if(canPlaceWall(c)) {
		var wallY = c.yPos;
		var wallX = c.xPos;
		c.entityUnderneath = 'wall';
		scheduleDespawn(g, c.room, c, wallY, wallX);
		c.wallsInUse++;
		c.emit('updateWallsInUse', c.wallsInUse);
		g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: c.username, colour: c.colour, entityUnderneath: c.entityUnderneath };
		m.updateMiniMapsInRoom(g, c.room);
	}
};