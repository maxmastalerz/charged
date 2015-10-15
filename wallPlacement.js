var m = require('./methods.js');

function playersNearbySpawn(g, c, wallY, wallX) {
	for(var username in g.rooms[c.room].players) {
		var iteratedClient = m.centFromUsername(g, c, username);
		if(m.dist(iteratedClient.xPos,iteratedClient.yPos,wallX,wallY)<5) {
			return true;
		}
	}
}

function scheduleDespawn(g, c, wallY, wallX) {
	setTimeout(function() {
		if(c.room!==null) {
			if(playersNearbySpawn(g, c, wallY, wallX)) {
				scheduleDespawn(g, c, wallY,wallX);
			} else if(g.rooms[c.room].map[wallY][wallX].type==='wall') {
				g.rooms[c.room].map[wallY][wallX] = {type: 'air'};
				m.updateMiniMapsInYourRoom(g, c);
				c.wallsInUse--;
				c.emit('updateWallsInUse', c.wallsInUse);
				m.updateMiniMapsInYourRoom(g, c);
			}
		}
	}, 7000);	//delay between trying to despawn the wall placed
}

function canPlaceWall(c) {
	if(c.room!==null && c.entityUnderneath===null && c.wallsInUse<3) {
		return true;
	}
}

module.exports = function(g, c) {
	if(canPlaceWall(c)) {
		var wallY = c.yPos;
		var wallX = c.xPos;
		c.entityUnderneath = 'wall';
		scheduleDespawn(g, c, wallY, wallX);
		c.wallsInUse++;
		c.emit('updateWallsInUse', c.wallsInUse);
		g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: c.username, colour: c.colour, entityUnderneath: c.entityUnderneath };
		m.updateMiniMapsInYourRoom(g, c);
	}
};