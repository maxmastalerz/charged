var m = require('./methods.js');

function spawnPickup(g, c) {
	var x, y;
	while(true) {
		x = Math.floor((Math.random() * (g.rooms[c.room].mapSize-3)) + 2);
		y = Math.floor((Math.random() * (g.rooms[c.room].mapSize-3)) + 2);
		if(g.rooms[c.room].map[y][x].type==='air') {
			break;
		}
	}
	g.rooms[c.room].map[y][x] = {type: 'crate'};
}

function playersNearbySpawn(g, c, bombY, bombX) {
	for(var username in g.rooms[c.room].players) {
		var iteratedClient = m.clientFromUsername(g, c, username);
		if(m.dist(iteratedClient.xPos,iteratedClient.yPos,bombX,bombY)<5) {
			return true;
		}
	}
}

function scheduleRespawn(g, c, bombY, bombX) {
	setTimeout(function() {
		if(c.room!==null) {
			if(playersNearbySpawn(g, c, bombY, bombX) || g.rooms[c.room].map[bombY][bombX].type==="wall") {
				scheduleRespawn(g, c, bombY,bombX);
			} else if(g.rooms[c.room].map[bombY][bombX].type==='air') {
				g.rooms[c.room].map[bombY][bombX].type = 'block';
				m.updateMiniMapsInYourRoom(g, c);
			}
		}
	}, 15000);	//delay between trying to respawn the block that was blown up
}

function canPlaceBomb(c) {
	if(c.room!==null && c.entityUnderneath===null && c.bombs>0) {
		return true;
	}
}

function destroyBlocks(g, c, bombY, bombX) {
	g.rooms[c.room].map[bombY][bombX].type = 'air';
	for(var i=-2;i<=2;i++) {
		if((bombY+i)===g.rooms[c.room].mapSize || (bombY+i)===g.rooms[c.room].mapSize-1 || (bombY+i)===0 || (bombY+i)===-1 || (g.rooms[c.room].map[bombY+i][bombX].type!=='block' && g.rooms[c.room].map[bombY+i][bombX].type!=='player')) {
			continue;
		} else {
			if(g.rooms[c.room].map[bombY+i][bombX].type!=='air') {
				if(g.rooms[c.room].map[bombY+i][bombX].type!=='bomb' && g.rooms[c.room].map[bombY+i][bombX].type!=='player') {
					scheduleRespawn(g, c, bombY+i,bombX);
				}
				g.rooms[c.room].map[bombY+i][bombX].type = 'air';
			}
		}
	}
	for(var ii=-2;ii<=2;ii++) {
		if((bombX+ii)===g.rooms[c.room].mapSize || (bombX+ii)===g.rooms[c.room].mapSize-1 || (bombX+ii)===0 || (bombX+ii)===-1 || (g.rooms[c.room].map[bombY][bombX+ii].type!=='block' && g.rooms[c.room].map[bombY][bombX+ii].type!=='player')) {
			continue;
		} else {
			if(g.rooms[c.room].map[bombY][bombX+ii].type!=='air') {
				if(g.rooms[c.room].map[bombY][bombX+ii].type!=='bomb' && g.rooms[c.room].map[bombY][bombX+ii].type!=='player') {
					scheduleRespawn(g, c, bombY,bombX+ii);
				}
				g.rooms[c.room].map[bombY][bombX+ii] = {type: 'air'};
			}
		}
	}
	spawnPickup(g, c);
	m.updateMiniMapsInYourRoom(g, c);
}

function checkForDeath(g, c) {
	for(var username in g.rooms[c.room].players) {
		var iteratedClient = m.clientFromUsername(g, c, username);
		if(g.rooms[c.room].map[iteratedClient.yPos][iteratedClient.xPos].type=='air') {
			iteratedClient.lives--;
			iteratedClient.emit('updateLives', iteratedClient.lives);
			if(iteratedClient.lives===0) {
				//do soming
			}
			m.spawn(g, iteratedClient);
		}
	}
}

function broadcastExplosion(g, c, bombY, bombX) {
	for(var username in g.rooms[c.room].players) {
		var iteratedClient = m.clientFromUsername(g, c, username);
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
		m.updateMiniMapsInYourRoom(g, c);

		setTimeout(function() {
			destroyBlocks(g, c, bombY, bombX);
			broadcastExplosion(g, c, bombY, bombX);
			checkForDeath(g, c);
		}, g.rooms[c.room].bombDelay);
	}
};