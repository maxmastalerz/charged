var sources = {
	grid: 'img/grid.png',
	bomb: 'img/bomb.png',
	heart: 'img/heart.png',
	crate: 'img/crate.png',
	redflag: 'img/redflag.png',
	blueflag: 'img/blueflag.png',
	explosion1: 'img/1.png',
	explosion2: 'img/2.png',
	explosion3: 'img/3.png',
	explosion4: 'img/4.png'
};

function loadImages(callback) {
	var images = {};
	var loadedImages = 0;
	var numImages = 0;
	for(var src in sources) {
		numImages++;
	}
	for(var src in sources) {
		images[src] = new Image();
		images[src].onload = function() {
			if(++loadedImages >= numImages) {
				callback(images);
			}
		};
		images[src].src = sources[src];
	}
}