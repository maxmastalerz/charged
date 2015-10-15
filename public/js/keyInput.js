var holdingUp = false, holdingDown = false, holdingLeft = false, holdingRight = false, holdingSpace = false, holdingB = false, upCount = 0, downCount = 0, leftCount = 0, rightCount = 0, spaceCount = 0, bCount = 0;
$('#game').keydown(function(e) {
	if(e.which==84) {			//'T'
		$('#data').focus();
		setTimeout(function() { $('#data').val($('#data').val().substring(0, $('#data').val().length - 1)); }, 1);
	}
});
$('#data').keydown(function(e) {
	if(e.which==27) {			//ESC
		$('#game').focus();
	} else if(e.which==13) {	//ENTER
		$('#datasend').trigger('cck');
		$('#game').focus();
	}
});

$('#game').keydown(function(e) {
	if(e.which==65 && !holdingLeft) { holdingLeft = true; leftCount++; }
	if(e.which==87 && !holdingUp) { holdingUp = true; upCount++; }
	if(e.which==68 && !holdingRight) { holdingRight = true; rightCount++; }
	if(e.which==83 && !holdingDown) { holdingDown = true;  downCount++; }
	if(e.which==32 && !holdingSpace) { holdingSpace = true; spaceCount++; }
	if(e.which==66 && !holdingB) { holdingB = true; bCount++; }
});
$('#game').keyup(function(e) {
	if(e.which==65) { holdingLeft = false; }
	if(e.which==87) { holdingUp = false; }
	if(e.which==68) { holdingRight = false; }
	if(e.which==83) { holdingDown = false; }
	if(e.which==32) { holdingSpace = false; }
	if(e.which==66) { holdingB = false; }
});
setInterval(function() {
	if(!(holdingUp && holdingDown)) {
		if((upCount>0) || holdingUp) {
			if(upCount>0) { upCount--; }
			s.emit('move', 0, -1);
		} else if((downCount>0) || holdingDown) {
			if(downCount>0) { downCount--; }
			s.emit('move', 0, 1);
		}
	} else {
		upCount = downCount = 0;
	}
	if(!(holdingLeft && holdingRight)) {
		if((leftCount>0) || holdingLeft) {
			if(leftCount>0) { leftCount--; }
			s.emit('move', -1, 0);
		} else if((rightCount>0) || holdingRight) {
			if(rightCount>0) { rightCount--; }
			s.emit('move', 1, 0);
		}
	} else {
		leftCount = rightCount = 0;
	}
	if((spaceCount>0) || holdingSpace) {
		if(spaceCount>0) { spaceCount--; }
		s.emit('placeBomb');
	}
	if((bCount>0) || holdingB) {
		if(bCount>0) { bCount--; }
		s.emit('placeWall');
	}
}, 122);

// Message for the Hackers:
// 1. Changing this value may spam the server and will cause your session to be unstable/prone to freezing and lagging.
// 2. The interval of server emitions is moderated by the server, and will result in a temporary IP ban.
// 3. The distance traveled is also monitored by the server.