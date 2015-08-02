var routeHomepage 	= require('./routes/routeHomepage.js');

module.exports = function (app) {
	app.get('/',		routeHomepage.routeOne);
};
