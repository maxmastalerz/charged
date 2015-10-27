var m = require('./methods.js');

function removeFromPlayerList(g, room, username) {
	for(var player in g.rooms[room].players) {
		if(player==username) {
			delete g.rooms[room].players[player];
			deleteRoomIfEmpty(g, room);
			m.updateRoomLists(g);
			if(g.rooms[room]!==undefined) {
				m.updatePlayersListIn(g, room);
			}
		}
	}
}

function removePlayerFromTeam(g, c, room) {
	if(c.team!==undefined) {
		if(c.team==='red') { g.rooms[room].redPlayers--; }
		else if(c.team==='blue') { g.rooms[room].bluePlayers--; }
	}
}

function deleteRoomIfEmpty(g, room) {
	g.rooms[room].playerCount = Object.keys(g.rooms[room].players).length;
	if(g.rooms[room].playerCount===0) {
		delete g.rooms[room];
	}
}

module.exports = function(g, c) {
	if(c.room!==undefined) {
		var room = c.room;
		c.leave(room);
		c.room = undefined;
		c.emit('leftRoom');
		if(g.rooms[room].gameMode==='ctf') {
			removePlayerFromTeam(g, c, room);
		}
		removeFromPlayerList(g, room, c.username);	//This will also delete rooms without players

		if(g.rooms[room]!==undefined) {
			c.broadcast.to(room).emit('updateChat', 'SERVER', '#00FFFF', c.username+' chose to leave');
			g.rooms[room].map[c.yPos][c.xPos] = {type: 'air'};
			m.updateMiniMapsInRoom(g, room);
		}
	}
};