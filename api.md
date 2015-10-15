# The 5 most important objects

## i : The includes object (Only present in Server.js)

```
http: 			require('http'),
socket: 		require('socket.io'),
app: 			require('express')(),
leave: 			require('./leave.js'),
move: 			require('./move.js'),
join: 			require('./join.js'),
create: 		require('./roomCreator.js'),
bombPlacement: 	require('./bombPlacement.js'),
wallPlacement: 	require('./wallPlacement.js')
```

## g : The game object

| Code                                                                                                | Explanation                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `g.io.of("/")`                                                                                      | SocketIO's default namespace                                 |
| `g.io.sockets.emit('eventName', optionalParameters);`                                               | Sends every client an event                                  |
| `g.rooms`                                                                                           | An array of rooms on the server                              |

A specific room from the rooms array and it's properties shown:

```
g.rooms[roomName] = {
	players: {
		username1: clientsId,
		username2: clientsId
	}
	playerCount: 2
	maxPlayers: 6
	gameMode: 'ffa'
	mapSize: 51
	mapVisibility: 31
	bombDelay: 3000
	roomPassword: null
	map: m.Create2DArray(mapSize)
};
```

## s : The server object.

| Code                                                                                                | Explanation                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `s.emit('move', deltaX, deltaY)`                                                                    | Tell server what direction we wish to move                   |
| `s.emit('checkRoomPassword', room, prompt('Input the password: '))`                                 | Tell server to check if the room password input was correct  |
| `s.emit('placeBomb')`                                                                               | Tell server that we want to place a bomb                     |
| `s.emit('placeWall')`                                                                               | Tell sserver that we want to place a wall                    |
| `s.emit('sendchat', message)`                                                                       | Tell server our desired chat message                         |
| `s.emit('changeName', prompt('Choose a custom name'))`                                              | Tell server our newly desired username                       |
| `s.emit('createRoom', name, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword)` | Tell server we wish to create a room with passed in settings |
| `s.emit('returnToMenu')`                                                                            | Tell server we wish to leave the room and return to the menu |
| `s.on('eventName', callback)`                                                                       | Server acts on the notification. Example: Moves the player   |

## c : The client object.

c.emit('errorMessage', message)															//Alerts an error to the client.
c.emit('updateBombs', bombCount)														//Updates bomb display
c.emit('joinedRoom')																	//Tell everyone in the lobby someone joined
c.emit('leftRoom')																		//Tell everyone in the lobby someone left
c.emit('updateRooms',[{roomName: 'blah',playerCount: 3,maxPlayers: 6},{},{}])			//Update one client with rooms. g.io.sockets.emit('updateRooms', rooms) will update everyone
c.emit('updateChat', displayName, colour, message)										//Sends a chat message to the client.
c.emit('updateLives', lifeCount)														//Updates life display
c.emit('updateBombs', bombCount)														//Updates bomb count
c.emit('updateWallsInUse', wallsInUse)													//Informs the client of how many walls he currently has placed down(NOT HOW MANY HE HAS LEFT).
c.emit('roomProtected', roomName)														//Prompts the client for a password to join the room.
c.emit('updateColour', colour)															//Changes the players colour

## m: The methods object    require('./methods.js');

m.Create2DArray(rows)																	//Used in creating a 2d array to represent the game board
m.dist(x1,y1,x2,y2)																		//Calculate the block distance between two grid points (x1,y1) and (x2,y2)
m.updateRoomLists(g)																	//Updates the list of rooms
m.clientFromUsername(g, c, username)													//Returns the client object after a username query
m.roomAvailable(g, roomName)															//Checks if room name is available
m.updateMiniMapsInYourRoom(g, c)														//Sends map data to every client. The data is a slice(around player) of the full room map
m.spawn(g, c)																			//Respawns the player randomly
m.updatePlayersListIn(g, c)																//Updates the list of players in the client's lobby
m.generateUsername(g, c)																//Generates a random username using 'silly-name' module
m.changeName(g, c, newName)																//Changes the player's name if valid
m.sanitizeInput(input)																	//Returns sanitized input. Must use on all client data