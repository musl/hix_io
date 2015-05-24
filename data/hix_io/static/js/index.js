/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

/*
 * A control for a shared photo timeline.
 */
 HixIO.DefaultControl = can.Control.extend({
 	defaults: {
 		view: 'home'
 	}
 }, {
 	'route': function() {
 		this.element.html(HixIO.view(this.options.view, {}));
 	}
 });

 HixIO.UserControl = can.Control.extend({
 	defaults: {
 		view: 'user'
 	}
 }, {
 	init: function() {
 		var self;

 		self = this;

 		HixIO.bind('user', function() {
 			var route;
 			route = can.route.attr('route');
 			if(route && route.match( /^user$/ )) { self.update(); }
 		});
 	},

 	update: function() {
 		this.element.html(HixIO.view(
 			this.options.view,
 			{
 				login: this.login,
 				logout: HixIO.logout,
 				user: HixIO.attr('user')
 			}
 		));
 	},

 	'user route': function() {
 		this.update();
 	},

 	login: function(context, element, event) {
 		var email;
 		var password;

 		email = $('#email').val();
 		password = $('#password').val();

 		HixIO.login(email, password);
 	}

 });

/*
 * A control for shortening urls.
 */
 HixIO.URLControl = can.Control.extend({
 	defaults: {
 		view: 'urls',
 	}
 }, {
 	init: function() {
 		var self;

 		self = this;

 		this.url = null;

 		HixIO.bind('user', function() {
 			var route;
 			route = can.route.attr('route');
 			if(route && route.match( /^urls$/ )) { self.update(); }
 		});
 	},

 	update: function() {
 		var self;

 		self = this;

 		HixIO.URL.summary().success(function(data) {
 			self.element.html(HixIO.view(
 				self.options.view,
 				{
 					scheme: HixIO.attr('meta').scheme,
 					host: HixIO.attr('meta').host,
 					top_urls: HixIO.URL.models(data.top),
 					latest_urls: HixIO.URL.models(data.latest),
 					url: self.url,
 					shorten: self.shorten,
 					user: HixIO.attr('user')
 				}
 				));
 		}).error(function(data) {
 			self.element.html('Error fetching URLs.');
 		});
 	},

 	'urls route': function() {
 		this.update();
 	},

 	shorten: function(context, element, event) {
		// FIXME: this is in the context ef the data passed to the view.
		HixIO.URL.shorten({
			url: element[0].value
		}).success(function(data) {
			self.url = HixIO.URL.model(data);
			self.update();
		}).error(function(data) {
			if(data.status === 403) {
				console.log('You aren\'t allowed to shorten urls.');
			} else if(data.status === 401) {
				console.log('You need to sign in to shorten URLs.');
			} else {
				console.log('I wasn\'t able to shorten that: ' + data.status);
			}
		});
	}
});

/*
 * A control for a shared photo timeline.
 */
 HixIO.Menu = can.Control.extend({
 	defaults: {
 		view: 'menu'
 	}
 }, {
 	init: function(element, options) {
 		var self;

 		self = this;

 		this.update();

 		HixIO.bind('user', function() {
 			self.update();
 		});
 	},

 	update: function() {
 		this.element.html(HixIO.view(this.options.view, {
 			logout: HixIO.logout,
 			user: HixIO.attr('user')
 		}));
 	}

 });

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

 $(document).ready(function() {
 	HixIO.menu = new HixIO.Menu('#menu', {});
 	can.each([
 		HixIO.DefaultControl,
 		HixIO.URLControl,
 		HixIO.UserControl
 		], function(Control) {
 			return new Control('#main');
 		});
 	HixIO.boot();
 });

