var page = 0;

function pageChng(rooms, diff) {
	var roomsPerPage = 13;
	var pageCount = Math.ceil(rooms.length/roomsPerPage);
	page+=diff;
	var start = page*roomsPerPage;
	var end = start+roomsPerPage;
	while(end>rooms.length) { end--; }

	if(page===pageCount) {
		page=0;
		start=0;
		end = start+roomsPerPage;
		while(end>rooms.length) { end--; }
	}
	if(page===-1) {
		page=(pageCount-1);
		start=(pageCount-1)*roomsPerPage;
		end = start+roomsPerPage;
		while(end>rooms.length) { end--; }
	}

	var shownRooms = rooms.slice(start,end);

	$('#roomList').empty();
	$('#roomList').append("<div style='font-size: 5.5vh; font-family: Bit; text-align: center; color: #4C767B'>&nbsp;Rooms<span class='prev' onclick='pageChng("+JSON.stringify(rooms)+", -1)'>←</span><span class='mext' onclick='pageChng("+JSON.stringify(rooms)+", 1)'>→</span></div>");
	for(var room=0;room<shownRooms.length;room++) {
		$('#roomList').append('<div style="font-size: 1.8vh; background-color: #4C767B; color: #334F52; font-size: 2vh; font-weight: 900; padding: 0.8vh; margin: 0.8vh;" onclick="s.emit(\'switchRoom\',\''+shownRooms[room].roomName+'\');">' + shownRooms[room].roomName + '<span style="float: right;">'+shownRooms[room].playerCount+'/'+shownRooms[room].maxPlayers+'</span></div>');
	}
}