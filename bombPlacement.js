var meth = require('./meth.js');

function spawnPickup(client, rooms) {
	var x, y;
	while(true) {
		x = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
		y = Math.floor((Math.random() * (rooms[client.room].mapSize-3)) + 2);
		if(rooms[client.room].map[y][x].type==='air') {
			break;
		}
	}
	rooms[client.room].map[y][x] = {type: 'crate'};
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
			if(playersNearbySpawn(io, client, rooms, bombY, bombX) || rooms[client.room].map[bombY][bombX].type==="wall") {
				scheduleRespawn(io, client, rooms, bombY,bombX);
			} else if(rooms[client.room].map[bombY][bombX].type==='air') {
				rooms[client.room].map[bombY][bombX].type = 'block';
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
			}
		}
	}, 15000);	//delay between trying to respawn the block that was blown up
}

function canPlaceBomb(client) {
	if(client.room!==null && client.entityUnderneath===null && client.bombs>0) {
		return true;
	}
}

function destroyBlocks(io, client, rooms, bombY, bombX) {
	for(var i=-2;i<=2;i++) {
		if((bombY+i)===rooms[client.room].mapSize || (bombY+i)===rooms[client.room].mapSize-1 || (bombY+i)===0 || (bombY+i)===-1 || rooms[client.room].map[bombY+i][bombX].type==='crate' || rooms[client.room].map[bombY+i][bombX].type==='indestructible') {
			continue;
		} else {
			if(rooms[client.room].map[bombY+i][bombX].type!=='air') {
				if(rooms[client.room].map[bombY+i][bombX].type!=='bomb' && rooms[client.room].map[bombY+i][bombX].type!=='player') {
					scheduleRespawn(io, client, rooms, bombY+i,bombX);
				}
				rooms[client.room].map[bombY+i][bombX].type = 'air';
			}
		}
	}
	for(var ii=-2;ii<=2;ii++) {
		if((bombX+ii)===rooms[client.room].mapSize || (bombX+ii)===rooms[client.room].mapSize-1 || (bombX+ii)===0 || (bombX+ii)===-1 || rooms[client.room].map[bombY][bombX+ii].type==='crate' || rooms[client.room].map[bombY][bombX+ii].type==='indestructible') {
			continue;
		} else {
			if(rooms[client.room].map[bombY][bombX+ii].type!=='air') {
				if(rooms[client.room].map[bombY][bombX+ii].type!=='bomb' && rooms[client.room].map[bombY][bombX+ii].type!=='player') {
					scheduleRespawn(io, client, rooms, bombY,bombX+ii);
				}
				rooms[client.room].map[bombY][bombX+ii] = {type: 'air'};
			}
		}
	}
	spawnPickup(client, rooms);
	meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
}

function checkForDeath(io, client, rooms) {
	for(var username in rooms[client.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, client);
		if(rooms[client.room].map[iteratedClient.yPos][iteratedClient.xPos].type=='air') {
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
		client.entityUnderneath = 'bomb';
		client.bombs--;
		client.emit('updateBombs', client.bombs);
		rooms[client.room].map[client.yPos][client.xPos] = { type: 'player', id: client.id, username: client.username, colour: client.colour, entityUnderneath: client.entityUnderneath };
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);

		setTimeout(function() {
			destroyBlocks(io, client, rooms, bombY, bombX);
			broadcastExplosion(io, client, rooms, bombY, bombX);
			checkForDeath(io, client, rooms);
		}, rooms[client.room].bombDelay);
	}
};