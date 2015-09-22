var meth = require('./meth.js');

function spawnPickup(client, rooms) {
	var x, y;
	while(true) {
		x = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
		y = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
		if(rooms[client.room].map[y][x]==='0') {
			break;
		}
	}
	rooms[client.room].map[y][x] = '4';
}

function playersNearbySpawn(io, client, rooms, bombY, bombX) {
	for(var username in rooms[client.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
		if(meth.dist(iteratedClient.xPos,iteratedClient.yPos,bombX,bombY)<5) {
			return true;
		}
	}
}

function scheduleRespawn(io, client, rooms, bombY, bombX) {
	setTimeout(function() {
		if(client.room!==null) {
			if(playersNearbySpawn(io, client, rooms, bombY, bombX)) {
				scheduleRespawn(io, client, rooms, bombY,bombX);
			} else if(rooms[client.room].map[bombY][bombX]==='0') {
				rooms[client.room].map[bombY][bombX] = '1';
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
			}
		}
	}, 15000);	//delay between trying to respawn the block that was blown up
}

function canPlaceBomb(client) {
	if(client.room!==null && !client.bombUnderneath && client.bombs>0) {
		return true;
	}
}

function destroyBlocks(io, client, rooms, bombY, bombX) {
	for(var i=-2;i<=2;i++) {
		if((bombY+i)===rooms[client.room].mapSize || (bombY+i)===rooms[client.room].mapSize-1 || (bombY+i)===0 || (bombY+i)===-1 || rooms[client.room].map[bombY+i][bombX]==='4') {
			continue;
		} else {
			if(rooms[client.room].map[bombY+i][bombX]!=='0') {
				if(rooms[client.room].map[bombY+i][bombX]!=='3' && rooms[client.room].map[bombY+i][bombX].username===undefined) {
					scheduleRespawn(io, client, rooms, bombY+i,bombX);
				}
				rooms[client.room].map[bombY+i][bombX] = '0';
			}
		}
	}
	for(var ii=-2;ii<=2;ii++) {
		if((bombX+ii)===rooms[client.room].mapSize || (bombX+ii)===rooms[client.room].mapSize-1 || (bombX+ii)===0 || (bombX+ii)===-1 || rooms[client.room].map[bombY][bombX+ii]==='4') {
			continue;
		} else {
			if(rooms[client.room].map[bombY][bombX+ii]!=='0') {
				if(rooms[client.room].map[bombY][bombX+ii]!=='3' && rooms[client.room].map[bombY][bombX+ii].username===undefined) {
					scheduleRespawn(io, client, rooms, bombY,bombX+ii);
				}
				rooms[client.room].map[bombY][bombX+ii] = '0';
			}
		}
	}
	spawnPickup(client, rooms);
	meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
}

function checkForDeath(io, client, rooms) {
	for(var username in rooms[client.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
		if(rooms[client.room].map[iteratedClient.yPos][iteratedClient.xPos]=='0') {
			iteratedClient.lives--;
			iteratedClient.emit('updateLives', iteratedClient.lives);
			if(iteratedClient.lives===0) {
				//do something
			}
			meth.spawn(io.of("/"), rooms, iteratedClient);
		}
	}
}

function broadcastExplosion(io, client, rooms, bombY, bombX) {
	for(var username in rooms[client.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
		iteratedClient.emit('explosionVisual', iteratedClient.miniMap, bombY-iteratedClient.offsetY, bombX-iteratedClient.offsetX);
	}
}

module.exports = function(io, client, rooms) {
	if(canPlaceBomb(client)) {
		var bombY = client.yPos;
		var bombX = client.xPos;
		client.bombUnderneath = true;
		client.bombs--;
		client.emit('updateBombs', client.bombs);
		rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);

		setTimeout(function() {
			destroyBlocks(io, client, rooms, bombY, bombX);
			broadcastExplosion(io, client, rooms, bombY, bombX);
			checkForDeath(io, client, rooms);
		}, rooms[client.room].bombDelay);
	}
};