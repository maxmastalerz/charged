var meth = require('./meth.js');
var join = require('./join.js');

function noCreationErrors(cli, rooms, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay) {
	var sentMessage = '';
	if(room==='null' || room==='[object Object]' || room==='undefined' || room==='' || (/^\s+$/.test(room))) {
		sentMessage+='Room name must not be blank\n';
	} if(!meth.roomAvailable(rooms, room)) {
		sentMessage+='This noom name must be unique\n';
	} if(room.length>15) {
		sentMessage+='The length of the name surpassed 15 chars\n';
	} if(maxPlayers<2 || maxPlayers>6) {
		sentMessage+='Max players was outside the 2-6 range\n';
	} if(gameMode==='null' || gameMode==='[object Object]' || gameMode==='undefined' || gameMode==='' || (/^\s+$/.test(gameMode))) {
		sentMessage+='Game mode must not be blank\n';
	} if(mapSize<10 || mapSize>70) {
		sentMessage+='Map size was outside the 10-70 range\n';
	} if(mapVisibility<5 || mapVisibility>35) {
		sentMessage+='Map visibility was outside the 5-35 range\n';
	} if(bombDelay<500 || bombDelay>3000) {
		sentMessage+='bombDelay was outside the 500-3000 range\n';
	}

	if(sentMessage==='') {
		return true;
	} else {
		cli.emit('errorMessage', 'Issues that occured when creating room: \n'+sentMessage);
	}
}

function generateMap(rooms, room) {
	var density = 4;	//from 0 - 10. Lower values mean more space
	var mapSize = rooms[room].mapSize;

	for(var y=0;y<rooms[room].mapSize;y++) {
		for(var x=0;x<rooms[room].mapSize;x++) {
			if(y===0 || y===rooms[room].mapSize-1 || x===0 || x===rooms[room].mapSize-1) {
				rooms[room].map[y][x] = {type: 'indestructible', colour: '#4C767B'};
			} else {
				var num = Math.floor((Math.random()*10)+0);
				if(num<density) {
					rooms[room].map[y][x] = {type: 'block'};
				} else {
					rooms[room].map[y][x] = {type: 'air'};
				}
			}
		}
	}

	if(rooms[room].gameMode==='ctf') {
		var base = [
			[0,0,1,1,1,1,1,1,1,1,1,1],
			[0,1,0,0,0,0,0,0,0,2,2,1],
			[1,0,3,0,0,0,0,0,1,2,2,1],
			[1,0,0,0,0,1,2,2,1,1,1,1],
			[1,0,0,0,0,0,1,1,0,0,1,0],
			[1,0,0,1,0,0,0,0,0,0,1,0],
			[1,0,0,2,1,0,0,0,0,0,0,0],
			[1,0,0,2,1,0,0,1,1,0,0,0],
			[1,0,1,1,0,0,0,1,1,1,0,0],
			[1,2,2,1,0,0,0,0,1,1,1,0],
			[1,2,2,1,1,1,0,0,0,1,1,0],
			[1,1,1,1,0,0,0,0,0,0,0,0]
		];
		for(var by=0;by<base.length;by++) {
			for(var bx=0;bx<base[0].length;bx++) {
				if(base[by][bx]===0) {
					rooms[room].map[by+1][bx+1] = {type: 'air'};
					rooms[room].map[-by+mapSize-2][-bx+mapSize-2] = {type: 'air'};
				} else if(base[by][bx]===1) {
					rooms[room].map[by+1][bx+1] = {type: 'indestructible', colour: 'red'};
					rooms[room].map[-by+mapSize-2][-bx+mapSize-2] = {type: 'indestructible', colour: 'blue'};
				} else if(base[by][bx]===2) {
					rooms[room].map[by+1][bx+1] = {type: 'crate'};
					rooms[room].map[-by+mapSize-2][-bx+mapSize-2] = {type: 'crate'};
				} else if(base[by][bx]===3) {
					rooms[room].map[by+1][bx+1] = {type: 'flag', colour: 'red'};
					rooms[room].map[-by+mapSize-2][-bx+mapSize-2] = {type: 'flag', colour: 'blue'};
				}
			}
		}
	}
}

module.exports = function(io, cli, rooms, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword) {
	room = meth.sanitizeInput(room);
	if(roomPassword!==undefined) { roomPassword = meth.sanitizeInput(roomPassword); }
	roomPassword = roomPassword || null;
	maxPlayers = parseInt(maxPlayers) || 6;
	gameMode = meth.sanitizeInput(gameMode) || 'ffa';
	mapSize = parseInt(mapSize) || 51;
	mapVisibility = parseInt(mapVisibility) || 31;
	if(mapVisibility>mapSize) {	mapVisibility = mapSize; }
	bombDelay = parseInt(bombDelay) || 1500;

	if(noCreationErrors(cli, rooms, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay)) {
		rooms[room] = {
			players: {},
			playerCount: 0,
			maxPlayers: maxPlayers,
			gameMode: gameMode,
			mapSize: mapSize,
			mapVisibility: mapVisibility,
			bombDelay: bombDelay,
			roomPassword: roomPassword,
			map: meth.Create2DArray(mapSize)
		};

		generateMap(rooms, room);
		join(io, cli, rooms, room);
	}
};