var server = io.connect('http://tic-tic-boom.herokuapp.com');

$(document).ready(function($) {
	var bomb = document.getElementById('bomb'),
		bombTitle = document.getElementById('bombTitle'),
		explosion1 = document.getElementById('explosion1'),
		explosion2 = document.getElementById('explosion2'),
		explosion3 = document.getElementById('explosion3'),
		explosion4 = document.getElementById('explosion4'),
		fire = document.getElementById('fire');

	var canvas = document.getElementById('game'),
		ctx = canvas.getContext('2d'),
		canvasMinWidth = parseInt($('#game').css('min-width'), 10),
		localMap;

	calcCanvasSizing();
	window.onresize = function(event) {
		calcCanvasSizing();
	};

	server.on('updateMap', function(map) {
		updateLocalMap(map);
		localMap = map;
	});

	server.on('explosionVisual', function(map, bombY, bombX) {
		var mapPad = 3;
		var mapSize = map.length;
		var tileS = (w/mapSize)-mapPad;

		ctx.drawImage(explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad)));
		setTimeout(function() { ctx.drawImage(explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 20);
		setTimeout(function() { ctx.drawImage(explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 40);
		setTimeout(function() { ctx.drawImage(explosion4,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 60);
		setTimeout(function() { ctx.drawImage(explosion3,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 80);
		setTimeout(function() { ctx.drawImage(explosion2,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); }, 100);
		setTimeout(function() { ctx.drawImage(explosion1,((bombX-2)*(tileS+mapPad)),((bombY-2)*(tileS+mapPad)),((5)*(tileS+mapPad)),((5)*(tileS+mapPad))); server.emit('clearDebris'); }, 120);
	});

	server.on('updateChat', function (username, colour, data) {
		$('#conversation').append('<b><font color="'+colour+'">'+ username + ':</font></b> ' + data + '<br>');
	});

	server.on('updatePlayersList', function(playersInRoom) {
		$('#playersInRoom').empty();
		for(var p=0; p<playersInRoom.length;p++) {
			$('#playersInRoom').append('<div>'+playersInRoom[p]+'</div>');
		}
	});

	server.on('updateRooms', function (rooms, current_room) {
		$('#rooms').empty();
		for(var room in rooms) {
			if(room == current_room) {
				$('#rooms').append('<div>'+room+'<span style="float: right;">'+rooms[room].playerCount+'/'+rooms[room].maxPlayers+'</span></div>');
			} else {
				$('#rooms').append('<div><a href="#" onclick="server.emit(\'switchRoom\',\''+room+'\');">' + room + '</a><span style="float: right;">'+rooms[room].playerCount+'/'+rooms[room].maxPlayers+'</span></div>');
			}
		}
	});

	server.on('usernameCreateError', function(errorMessage) {
		server.emit('changeName', prompt(errorMessage));
	});

	server.on('roomCreateError', function(errorMessage) {
		alert(errorMessage);
	});

	$(function(){
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			server.emit('sendchat', message);
		});

		$('#changeName').click(function() {
			server.emit('changeName', prompt('Choose a custom name: '));
		});

		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});

		$('#roombutton').click(function(){
			var name = $('#roomname').val();
			var maxPlayers = $('#maxPlayers').val();
			var mapSize = $('#mapSize').val();
			var mapVisibility = $('#mapVisibility').val();
			var bombDelay = $('#bombDelay').val();
			var roomPassword = $('#roomPassword').val();

			$('#roomname').val('');
			$('#maxPlayers').val('6');
			$('#mapSize').val('');
			$('#mapVisibility').val('');
			$('#bombDelay').val('');
			$('#roomPassword').val('');
			server.emit('createRoom', name, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword);
		});
	});

	var holdingUp = false,
		holdingDown = false,
		holdingLeft = false,
		holdingRight = false,
		holdingSpace = false,
		upCount = 0,
		downCount = 0,
		leftCount = 0,
		rightCount = 0,
		spaceCount = 0;

		//http://jsfiddle.net/ypnjdqnq/

	$(document).keydown(function(e) {
		if(e.which==37 && !holdingLeft) { holdingLeft = true; leftCount++; }
		if(e.which==38 && !holdingUp) { holdingUp = true; upCount++; }
		if(e.which==39 && !holdingRight) { holdingRight = true; rightCount++; }
		if(e.which==40 && !holdingDown) { holdingDown = true;  downCount++; }
		if(e.which==32 && !holdingSpace) { holdingSpace = true; spaceCount++; }
	});
	$(document).keyup(function(e) {
		if(e.which==37) { holdingLeft = false; }
		if(e.which==38) { holdingUp = false; }
		if(e.which==39) { holdingRight = false; }
		if(e.which==40) { holdingDown = false; }
		if(e.which==32) { holdingSpace = false; }
	});


	setInterval(function() {
		if((upCount>0) || holdingUp) {
			if(upCount>0) { upCount--; }
			server.emit('move', 0, -1);
		} else if((downCount>0) || holdingDown) {
			if(downCount>0) { downCount--; }
			server.emit('move', 0, 1);
		}
		if((leftCount>0) || holdingLeft) {
			if(leftCount>0) { leftCount--; }
			server.emit('move', -1, 0);
		} else if((rightCount>0) || holdingRight) {
			if(rightCount>0) { rightCount--; }
			server.emit('move', 1, 0);
		}
		if((spaceCount>0) || holdingSpace) {
			if(spaceCount>0) { spaceCount--; }
			server.emit('placeBomb');
		}
	}, 160);



	function updateLocalMap(map) {
		var mapPad = 3;
		var mapSize = map.length;
		var tileS = (w/mapSize)-mapPad;

		ctx.fillStyle = "black";ctx.fillRect(0,0,w,h);
		ctx.font = "10px Verdana";

		for(var y=0;y<mapSize;y++) {			//Y
			for(var x=0;x<mapSize;x++) {		//X
				if(map[y][x]==='0') {			//Empty space
					ctx.fillStyle = "black";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='1') {	//Regular wall
					ctx.fillStyle = "#3D3D3D";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='2') {	//Indestructable wall
					ctx.fillStyle="black";
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				} else if(map[y][x]==='3') { 	//BOMB
					ctx.drawImage(bomb, (x)*(tileS+mapPad), (y)*(tileS+mapPad), tileS, tileS);
				}

				if(map[y][x].username!==undefined && map[y][x].bombUnderneath===true) {
					ctx.fillStyle = map[y][x].colour;
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
					ctx.drawImage(bomb, (x)*(tileS+mapPad)-1, (y)*(tileS+mapPad)-1, tileS+mapPad, tileS+mapPad);
				} else if(map[y][x].username!==undefined) {						//Player
					ctx.fillStyle = map[y][x].colour;
					ctx.textAlign = "center";
					ctx.fillText(map[y][x].username,((x)*(tileS+mapPad))+(tileS/2),((y)*(tileS+mapPad))-(tileS/2));
					ctx.fillRect((x)*(tileS+mapPad),(y)*(tileS+mapPad),tileS,tileS);
				}
			}
		}
	}
	function calcCanvasSizing() {
		if($(window).width()/3<canvasMinWidth) {
			w = canvas.height = canvas.width = canvasMinWidth;
		} else {
			w = canvas.height = canvas.width = $(window).width()/3;
		}
		h = w;
		if(localMap!==undefined) {
			updateLocalMap(localMap);
		} else {
			ctx.drawImage(fire,0,0,w,h);
			ctx.drawImage(bombTitle,0,0,w,h);
		}
	}
	function debounce(fn, delay) {
		var timer = null;
		return function() {
			var context = this, args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function() {
				fn.apply(context, args);
			}, delay);
		};
	}
});