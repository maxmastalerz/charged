$('#datasend').click( function() {
	var message = $('#data').val();
	$('#data').val('');
	s.emit('sendchat', message);
	scrollChat();
});
$('#changeName').click(function() {
	s.emit('changeName', prompt('Choose a custom name: '));
});

$('#roombutton').click(function(){
	var name = $('#roomname').val();
	var maxPlayers = $('#maxPlayers').val();
	var gameMode = $('#gameMode').val();
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
	s.emit('createRoom', name, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword);
});
$('#returnToMenu').click(function(e) {
	s.emit('returnToMenu');
});