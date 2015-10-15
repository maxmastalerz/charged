var meth = require('./meth.js');

function playersNearbySpawn(io, cli, rooms, wallY, wallX) {
	for(var username in rooms[cli.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, cli);
		if(meth.dist(iteratedClient.xPos,iteratedClient.yPos,wallX,wallY)<5) {
			return true;
		}
	}
}

function scheduleDespawn(io, cli, rooms, wallY, wallX) {
	setTimeout(function() {
		if(cli.room!==null) {
			if(playersNearbySpawn(io, cli, rooms, wallY, wallX)) {
				scheduleDespawn(io, cli, rooms, wallY,wallX);
			} else if(rooms[cli.room].map[wallY][wallX].type==='wall') {
				rooms[cli.room].map[wallY][wallX] = {type: 'air'};
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
				cli.wallsInUse--;
				cli.emit('updateWallsInUse', cli.wallsInUse);
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
			}
		}
	}, 7000);	//delay between trying to despawn the wall placed
}

function canPlaceWall(cli) {
	if(cli.room!==null && cli.entityUnderneath===null && cli.wallsInUse<3) {
		return true;
	}
}

module.exports = function(io, cli, rooms) {
	if(canPlaceWall(cli)) {
		var wallY = cli.yPos;
		var wallX = cli.xPos;
		cli.entityUnderneath = 'wall';
		scheduleDespawn(io, cli, rooms, wallY, wallX);
		cli.wallsInUse++;
		cli.emit('updateWallsInUse', cli.wallsInUse);
		rooms[cli.room].map[cli.yPos][cli.xPos] = { type: 'player', id: cli.id, username: cli.username, colour: cli.colour, entityUnderneath: cli.entityUnderneath };
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
	}
};