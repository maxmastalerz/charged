var meth = require('./meth.js');

function spawnPickup(cli, rooms) {
	var x, y;
	while(true) {
		x = Math.floor((Math.random() * (rooms[cli.room].mapSize-3)) + 2);
		y = Math.floor((Math.random() * (rooms[cli.room].mapSize-3)) + 2);
		if(rooms[cli.room].map[y][x].type==='air') {
			break;
		}
	}
	rooms[cli.room].map[y][x] = {type: 'crate'};
}

function playersNearbySpawn(io, cli, rooms, bombY, bombX) {
	for(var username in rooms[cli.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, cli);
		if(meth.dist(iteratedClient.xPos,iteratedClient.yPos,bombX,bombY)<5) {
			return true;
		}
	}
}

function scheduleRespawn(io, cli, rooms, bombY, bombX) {
	setTimeout(function() {
		if(cli.room!==null) {
			if(playersNearbySpawn(io, cli, rooms, bombY, bombX) || rooms[cli.room].map[bombY][bombX].type==="wall") {
				scheduleRespawn(io, cli, rooms, bombY,bombX);
			} else if(rooms[cli.room].map[bombY][bombX].type==='air') {
				rooms[cli.room].map[bombY][bombX].type = 'block';
				meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
			}
		}
	}, 15000);	//delay between trying to respawn the block that was blown up
}

function canPlaceBomb(cli) {
	if(cli.room!==null && cli.entityUnderneath===null && cli.bombs>0) {
		return true;
	}
}

function destroyBlocks(io, cli, rooms, bombY, bombX) {
	rooms[cli.room].map[bombY][bombX].type = 'air';
	for(var i=-2;i<=2;i++) {
		if((bombY+i)===rooms[cli.room].mapSize || (bombY+i)===rooms[cli.room].mapSize-1 || (bombY+i)===0 || (bombY+i)===-1 || rooms[cli.room].map[bombY+i][bombX].type==='crate' || rooms[cli.room].map[bombY+i][bombX].type==='bomb' || rooms[cli.room].map[bombY+i][bombX].type==='indestructible') {
			continue;
		} else {
			if(rooms[cli.room].map[bombY+i][bombX].type!=='air') {
				if(rooms[cli.room].map[bombY+i][bombX].type!=='bomb' && rooms[cli.room].map[bombY+i][bombX].type!=='player') {
					scheduleRespawn(io, cli, rooms, bombY+i,bombX);
				}
				rooms[cli.room].map[bombY+i][bombX].type = 'air';
			}
		}
	}
	for(var ii=-2;ii<=2;ii++) {
		if((bombX+ii)===rooms[cli.room].mapSize || (bombX+ii)===rooms[cli.room].mapSize-1 || (bombX+ii)===0 || (bombX+ii)===-1 || rooms[cli.room].map[bombY][bombX+ii].type==='crate' || rooms[cli.room].map[bombY][bombX+ii].type==='bomb' || rooms[cli.room].map[bombY][bombX+ii].type==='indestructible') {
			continue;
		} else {
			if(rooms[cli.room].map[bombY][bombX+ii].type!=='air') {
				if(rooms[cli.room].map[bombY][bombX+ii].type!=='bomb' && rooms[cli.room].map[bombY][bombX+ii].type!=='player') {
					scheduleRespawn(io, cli, rooms, bombY,bombX+ii);
				}
				rooms[cli.room].map[bombY][bombX+ii] = {type: 'air'};
			}
		}
	}
	spawnPickup(cli, rooms);
	meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
}

function checkForDeath(io, cli, rooms) {
	for(var username in rooms[cli.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, cli);
		if(rooms[cli.room].map[iteratedClient.yPos][iteratedClient.xPos].type=='air') {
			iteratedClient.lives--;
			iteratedClient.emit('updateLives', iteratedClient.lives);
			if(iteratedClient.lives===0) {
				//do something
			}
			meth.spawn(io.of("/"), rooms, iteratedClient);
		}
	}
}

function broadcastExplosion(io, cli, rooms, bombY, bombX) {
	for(var username in rooms[cli.room].players) {
		var iteratedClient = meth.clientFromUsername(io.of("/"), username, cli);
		iteratedClient.emit('explosionVisual', iteratedClient.miniMap, bombY-iteratedClient.offsetY, bombX-iteratedClient.offsetX);
	}
}

module.exports = function(io, cli, rooms) {
	if(canPlaceBomb(cli)) {
		var bombY = cli.yPos;
		var bombX = cli.xPos;
		cli.entityUnderneath = 'bomb';
		cli.bombs--;
		cli.emit('updateBombs', cli.bombs);
		rooms[cli.room].map[cli.yPos][cli.xPos] = { type: 'player', id: cli.id, username: cli.username, colour: cli.colour, entityUnderneath: cli.entityUnderneath };
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);

		setTimeout(function() {
			destroyBlocks(io, cli, rooms, bombY, bombX);
			broadcastExplosion(io, cli, rooms, bombY, bombX);
			checkForDeath(io, cli, rooms);
		}, rooms[cli.room].bombDelay);
	}
};