var meth = require('./meth.js');

function hackedMovement(client, deltaX, deltaY) {
	if(client.room!==null && deltaX>-2 && deltaX<2 && deltaY>-2 && deltaY<2) {
		return false;
	}
}
function validDestination(client, rooms, deltaX, deltaY) {
	if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='0' || rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='4') {
		return true;
	}
}
function pickedUpBomb(client, rooms, deltaX, deltaY) {
	if(rooms[client.room].map[client.yPos+deltaY][client.xPos+deltaX]==='4') {
		return true;
	}
}
function decideBlockTrail(client, rooms) {	//Determines whether to leave a empty block or a bomb at the player's previous position.
	if(client.bombUnderneath===false) {
		rooms[client.room].map[client.yPos][client.xPos] = '0';
	} else {
		rooms[client.room].map[client.yPos][client.xPos] = '3';
		//rooms[client.room].map[client.yPos][client.xPos] = '1';//wall placing?
	}
	client.bombUnderneath = false;
}
function movePlayer(client, rooms, deltaX, deltaY) {
	client.xPos+=deltaX;
	client.yPos+=deltaY;
	rooms[client.room].map[client.yPos][client.xPos] = { id: client.id, username: client.username, colour: client.colour, bombUnderneath: client.bombUnderneath };
}

module.exports = function(io, client, rooms, deltaX, deltaY) {
	if(client.room!==null) {
		if(!hackedMovement(client, deltaX, deltaY) && validDestination(client, rooms, deltaX, deltaY)) {
			decideBlockTrail(client, rooms);

			if(pickedUpBomb(client, rooms, deltaX, deltaY)) {
				client.bombs++;
				client.emit('updateBombs', client.bombs);
			}

			movePlayer(client, rooms, deltaX, deltaY);
			meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
		}
	}
};