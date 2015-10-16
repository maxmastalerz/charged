var m = require('./methods.js');

function hackedMovement(c, deltaX, deltaY) {
	if(c.room!==null && deltaX>-2 && deltaX<2 && deltaY>-2 && deltaY<2) {
		return false;
	}
}
function validDestination(g, c, deltaX, deltaY) {
	if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].type==='air' || g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].type==='crate' || canPickUpFlag(g,c,deltaX,deltaY)) {
		return true;
	}
	if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].type==='wall') {
		if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].owner===c.username && g.rooms[c.room].gameMode==='ffa') {
			return true;
		}
		if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].owner===c.team && g.rooms[c.room].gameMode==='ctf') {
			return true;
		}
	}
}
function pickedUpBomb(g, c, deltaX, deltaY) {
	if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].type==='crate') {
		return true;
	}
}
function canPickUpFlag(g, c, deltaX, deltaY) {
	if(g.rooms[c.room].gameMode==='ctf') {
		if(g.rooms[c.room].map[c.xPos+deltaX][c.yPos+deltaY].type==='flag') {
			if(c.team==='red' && g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].colour==='blue') {
				c.carryingFlag='blue';
				g.rooms[c.room].map[c.yPos][c.xPos].carryingFlag = 'blue';
				m.updateMiniMapsInYourRoom(g, c);
				g.io.sockets.in(c.room).emit('flagStolen', c.carryingFlag);
				return true;
			}
			if(c.team==='blue' && g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].colour==='red') {
				c.carryingFlag='red';
				g.rooms[c.room].map[c.yPos][c.xPos].carryingFlag = 'red';
				m.updateMiniMapsInYourRoom(g, c);
				g.io.sockets.in(c.room).emit('flagStolen', c.carryingFlag);
				return true;
			}
		}
	}
}
function decideBlockTrail(g, c) {	//Determines whether to leave a empty block or a bomb at the player's previous position.
	if(c.entityUnderneath===null) {
		g.rooms[c.room].map[c.yPos][c.xPos] = {type: 'air'};
	} else if(c.entityUnderneath==='bomb') {
		g.rooms[c.room].map[c.yPos][c.xPos] = {type: 'bomb'};
	} else if(c.entityUnderneath==='wall') {
		if(g.rooms[c.room].gameMode==='ctf') {
			g.rooms[c.room].map[c.yPos][c.xPos] = {type: 'wall', colour: c.colour, owner: c.team};
		} else {
			g.rooms[c.room].map[c.yPos][c.xPos] = {type: 'wall', colour: c.colour, owner: c.username};
		}
	}
	c.entityUnderneath = null;
}
function movePlayer(g, c, deltaX, deltaY) {
	c.xPos+=deltaX;
	c.yPos+=deltaY;
	g.rooms[c.room].map[c.yPos][c.xPos] = { type: 'player', id: c.id, username: c.username, colour: c.colour, entityUnderneath: c.entityUnderneath, carryingFlag: c.carryingFlag };
}
function checkForFlagCapture(g,c) {
	if(c.carryingFlag==='blue' && m.dist(c.xPos,c.yPos,3,3)<3) {
		console.log('Red captured a flag!');
		g.io.sockets.in(c.room).emit('flagCaptured', c.carryingFlag);
		g.rooms[c.room].map[g.rooms[c.room].mapSize-4][g.rooms[c.room].mapSize-4].type='flag';
		g.rooms[c.room].map[g.rooms[c.room].mapSize-4][g.rooms[c.room].mapSize-4].colour='blue';
		c.carryingFlag = undefined;
	} else if(c.carryingFlag==='red' && m.dist(c.xPos,c.yPos,g.rooms[c.room].mapSize-4,g.rooms[c.room].mapSize-4)<3) {
		console.log('Blue captured a flag!');
		g.io.sockets.in(c.room).emit('flagCaptured', c.carryingFlag);
		g.rooms[c.room].map[3][3].type='flag';
		g.rooms[c.room].map[3][3].colour='red';
		c.carryingFlag = undefined;
	}
}

module.exports = function(g, c, deltaX, deltaY) {
	if(c.room!==null) {
		if(!hackedMovement(c, deltaX, deltaY) && validDestination(g, c, deltaX, deltaY)) {
			decideBlockTrail(g, c);

			if(pickedUpBomb(g, c, deltaX, deltaY)) {
				c.bombs++;
				c.emit('updateBombs', c.bombs);
			}

			var walkedOnWall = false;
			if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].type==='wall') {
				if(g.rooms[c.room].map[c.yPos+deltaY][c.xPos+deltaX].colour===c.colour) {
					walkedOnWall = true;
				}
			}

			movePlayer(g, c, deltaX, deltaY);
			checkForFlagCapture(g,c);
			if(walkedOnWall) { c.entityUnderneath='wall'; }
			m.updateMiniMapsInYourRoom(g, c);
		}
	}
};