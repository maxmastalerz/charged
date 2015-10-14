var meth = require('./meth.js');

function playersNearbySpawn(io, client, rooms, wallY, wallX) {
	for(var username in rooms[client.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
		if(meth.dist(iteratedClient.xPos,iteratedClient.yPos,wallX,wallY)<5) {
			return true;
		}
	}
}

function scheduleDespawn(io, client, rooms, wallY, wallX) {
	setTimeout(function() {
		if(client.room!==null) {
			if(playersNearbySpawn(io, client, rooms, wallY, wallX)) {
				scheduleDespawn(io, client, rooms, wallY,wallX);
			} else if(rooms[client.room].map[wallY][wallX].type==='wall') {
				rooms[client.room].map[wallY][wallX] = {type: 'air'};
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
				client.wallsInUse--;
				client.emit('updateWallsInUse', client.wallsInUse);
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
			}
		}
	}, 7000);	//delay between trying to despawn the wall placed
}

function canPlaceWall(client) {
	if(client.room!==null && client.entityUnderneath===null && client.wallsInUse<3) {
		return true;
	}
}

module.exports = function(io, client, rooms) {
	if(canPlaceWall(client)) {
		var wallY = client.yPos;
		var wallX = client.xPos;
		client.entityUnderneath = 'wall';
		scheduleDespawn(io, client, rooms, wallY, wallX);
		client.wallsInUse++;
		client.emit('updateWallsInUse', client.wallsInUse);
		rooms[client.room].map[client.yPos][client.xPos] = { type: 'player', id: client.id, username: client.username, colour: client.colour, entityUnderneath: client.entityUnderneath };
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
	}
};