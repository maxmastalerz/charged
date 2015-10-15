function scrollChat() {
	var height = 0;
	$('#conversation p').each(function(i, value){
		height += parseInt($(this).height());
	});
	height += '';
	$('#conversation').animate({scrollTop: height});
}

function updateChat(username, colour, data) {
	var elem = $('#conversation');
	if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()){
		scrollChat();
	}
	$('#conversation').append('<p><b><font color="'+colour+'">'+ username + ':</font></b> ' + data + '</p>');
}