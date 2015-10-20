var m = require('./methods.js');
var leave = require('./leave.js');

function spawnPickup(g, room) {
	var x, y;
	while(true) {
		x = Math.floor((Math.random() * (g.rooms[room].mapSize-3)) + 2);
		y = Math.floor((Math.random() * (g.rooms[room].mapSize-3)) + 2);
		if(g.rooms[room].map[y][x].type==='air') {
			break;
		}
	}
	g.rooms[room].map[y][x] = {type: 'crate'};
}

function playersNearbySpawn(g, room, bombY, bombX) {
	for(var username in g.rooms[room].players) {
		var iteratedClient = m.clientFromUsername(g, username);
		if(m.dist(iteratedClient.xPos,iteratedClient.yPos,bombX,bombY)<5) {
			return true;
		}
	}
}

function scheduleRespawn(g, room, bombY, bombX) {
	setTimeout(function() {
		if(g.rooms[room]!==undefined) {
			if(playersNearbySpawn(g, room, bombY, bombX) || g.rooms[room].map[bombY][bombX].type==="wall") {
				scheduleRespawn(g, room, bombY,bombX);
			} else if(g.rooms[room].map[bombY][bombX].type==='air') {
				g.rooms[room].map[bombY][bombX].type = 'block';
				m.updateMiniMapsInRoom(g, room);
			}
		}
	}, 15000);	//delay between trying to respawn the block that was blown up
}

function canPlaceBomb(c) {
	if(c.room!==undefined && c.entityUnderneath===null && c.bombs>0) {
		return true;
	}
}

function destroyBlocks(g, room, bombY, bombX) {
	g.rooms[room].map[bombY][bombX].type = 'air';
	for(var i=-2;i<=2;i++) {
		if((bombY+i)===g.rooms[room].mapSize || (bombY+i)===g.rooms[room].mapSize-1 || (bombY+i)===0 || (bombY+i)===-1 || (g.rooms[room].map[bombY+i][bombX].type!=='block' && g.rooms[room].map[bombY+i][bombX].type!=='player')) {
			continue;
		} else {
			if(g.rooms[room].map[bombY+i][bombX].type!=='air') {
				if(g.rooms[room].map[bombY+i][bombX].type!=='bomb' && g.rooms[room].map[bombY+i][bombX].type!=='player') {
					scheduleRespawn(g, room, bombY+i,bombX);
				}
				g.rooms[room].map[bombY+i][bombX].type = 'air';
			}
		}
	}
	for(var ii=-2;ii<=2;ii++) {
		if((bombX+ii)===g.rooms[room].mapSize || (bombX+ii)===g.rooms[room].mapSize-1 || (bombX+ii)===0 || (bombX+ii)===-1 || (g.rooms[room].map[bombY][bombX+ii].type!=='block' && g.rooms[room].map[bombY][bombX+ii].type!=='player')) {
			continue;
		} else {
			if(g.rooms[room].map[bombY][bombX+ii].type!=='air') {
				if(g.rooms[room].map[bombY][bombX+ii].type!=='bomb' && g.rooms[room].map[bombY][bombX+ii].type!=='player') {
					scheduleRespawn(g, room, bombY,bombX+ii);
				}
				g.rooms[room].map[bombY][bombX+ii] = {type: 'air'};
			}
		}
	}
	spawnPickup(g, room);
	m.updateMiniMapsInRoom(g, room);
}

function checkForDeath(g, room, c) {
	for(var username in g.rooms[room].players) {
		var iteratedClient = m.clientFromUsername(g, username);
		if(g.rooms[room].map[iteratedClient.yPos][iteratedClient.xPos].type=='air') {
			iteratedClient.lives--;
			if(iteratedClient.carryingFlag==='red') {
				g.rooms[room].map[3][3].type='flag';
				g.rooms[room].map[3][3].colour='red';
				g.io.sockets.in(room).emit('flagDropped', iteratedClient.carryingFlag);
			} else if(iteratedClient.carryingFlag==='blue') {
				g.rooms[room].map[g.rooms[room].mapSize-4][g.rooms[room].mapSize-4].type='flag';
				g.rooms[room].map[g.rooms[room].mapSize-4][g.rooms[room].mapSize-4].colour='blue';
				g.io.sockets.in(room).emit('flagDropped', iteratedClient.carryingFlag);
			}

			iteratedClient.carryingFlag = undefined;
			iteratedClient.emit('updateLives', iteratedClient.lives);
			if(iteratedClient.lives===0) {
				leave(g,c);
			} else {
				m.spawn(g, iteratedClient);
			}
		}
	}
}

function broadcastExplosion(g, room, bombY, bombX) {
	for(var username in g.rooms[room].players) {
		var iteratedClient = m.clientFromUsername(g, username);
		iteratedClient.emit('explosionVisual', iteratedClient.miniMap, bombY-iteratedClient.offsetY, bombX-iteratedClient.offsetX);
	}
}

module.exports = function(g, c) {
	if(canPlaceBomb(c)) {
		var bombY = c.yPos;
		var bombX = c.xPos;
		c.entityUnderneath = 'bomb';
		c.bombs--;
		c.emit('updateBombs', c.bombs);
		g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: c.username, colour: c.colour, entityUnderneath: c.entityUnderneath };
		m.updateMiniMapsInRoom(g, c.room);

		var room = c.room;
		setTimeout(function() {
			if(g.rooms[room]!==undefined) {
				destroyBlocks(g, room, bombY, bombX);
				broadcastExplosion(g, room, bombY, bombX);
				checkForDeath(g, room, c);
			}
		}, g.rooms[c.room].bombDelay);
	}
};