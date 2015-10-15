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
| `s.emit('checkRoomPassword', room, prompt('Input password: '))`                                     | Tell server to check if the room password input was correct  |
| `s.emit('placeBomb')`                                                                               | Tell server that we want to place a bomb                     |
| `s.emit('placeWall')`                                                                               | Tell server that we want to place a wall                     |
| `s.emit('sendchat', message)`                                                                       | Tell server our desired chat message                         |
| `s.emit('changeName', prompt('Choose a custom name'))`                                              | Tell server our newly desired username                       |
| `s.emit('createRoom', name, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword)` | Tell server we wish to create a room with passed in settings |
| `s.emit('returnToMenu')`                                                                            | Tell server we wish to leave the room and return to the menu |
| `s.on('eventName', callback)`                                                                       | Client listening in on a server emition and ready to act     |

## c : The client object.

| Code                                                                                                | Explanation                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `c.emit('errorMessage', message)`                                                                   | Alert an error message to the client                         |
| `c.emit('updateBombs', bombCount)`                                                                  | Update the client's bomb count display                       |
| `c.emit('joinedRoom')`                                                                              | Tell the client they've joined the room                      |
| `c.emit('leftRoom')`                                                                                | Tell the client they've left the room                        |
| `c.emit('updateRooms',[{roomName: 'blah',playerCount: 3,maxPlayers: 6},{},{}])`                     | Update the client with the rooms list                        |
| `c.emit('updateChat', displayName, colour, message)`                                                | Send a chat message to the client                            |
| `c.emit('updateLives', lifeCount)`                                                                  | Update the client with their life count                      |
| `c.emit('updateBombs', bombCount)`                                                                  | Update the client with their bomb count                      |
| `c.emit('updateWallsInUse', wallsInUse`)                                                            | Update the client with the amount of walls they have in use  |
| `c.emit('roomProtected', roomName)`                                                                 | Tell the client the room they are joining requires a pass    |
| `c.emit('updateColour', colour)`                                                                    | Update the client with their new colour                      |
| `c.on('eventName')`                                                                                 | Server listening in on a client emition and readt to act     |

## m: The methods object    require('./methods.js');

| Code                                                                                                | Explanation                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `m.Create2DArray(rows)`                                                                             | Used in creating a 2d array game board with the size of rows |
| `m.dist(x1,y1,x2,y2)`                                                                               | Calculates distance between (x1,y1) and (x2,y2)              |
| `m.updateRoomLists(g)`                                                                              | Sends every client and updated room list                     |
| `m.clientFromUsername(g, c, username)`                                                              | Returns a client object from a user with a specific username |
| `m.roomAvailable(g, roomName)`                                                                      | Checks if a room name is available                           |
| `m.updateMiniMapsInYourRoom(g, c)`                                                                  | Updates every client's game map view                         |
| `m.spawn(g, c)`                                                                                     | Randomly spawns the client in the room                       |
| `m.generateUsername(g, c)`                                                                          | Randomly generates the client's username                     |
| `m.changeName(g, c , newName)`                                                                      | Changes the client's name                                    |
| `m.sanitizeInput(input)`                                                                            | Returns sanitized input. Must use on all client data         |