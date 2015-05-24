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
 					shorten: self.shorten.bind(self),
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
 		var self;

 		self = this;

		HixIO.URL.shorten({
			url: element[0].value
		}).success(function(data) {
			self.url = HixIO.URL.model(data);
			self.update();
		}).error(function(data) {
			if(data.status === 403) {
				HixIO.log('You aren\'t allowed to shorten urls.', 'warn');
			} else if(data.status === 401) {
				HixIO.log('You need to sign in to shorten URLs.', 'warn');
			} else {
				HixIO.log('I wasn\'t able to shorten that: ' + data.status, 'warn');
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


/*
 * A control for a shared photo timeline.
 */
 HixIO.MessageBox = can.Control.extend({
 	defaults: {
 		view: 'message_box',
 		delay: 10000
 	}
 }, {
 	init: function(element, options) {
 		var self;

 		self = this;

 		HixIO.bind('message', function() {
 			var message;

 			message = HixIO.attr('message');
 			if(message && message.message) { self.show(); }
 		});

 		can.route.bind('route', function() { self.cancel(); });

 		this.timeout = null;
 	},

 	cancel: function() {
 		if(this.timeout) {
 			this.timeout = null;
 			clearTimeout(this.timeout);
 		}
 		this.hide();
 	},

 	show: function() {
 		var message, self;

 		self = this;

 		this.cancel();
 		this.element.html(HixIO.view(
 			this.options.view, HixIO.removeAttr('message')
 			));
 		this.timeout = setTimeout(function() {
 			self.hide();
 		}, this.options.delay);
 	},

 	hide: function() {
 		this.element.html('');
 	}

 });

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

 $(document).ready(function() {

 	/* Routable controls; those that share control over the main content. */
 	can.each([
 		HixIO.DefaultControl,
 		HixIO.URLControl,
 		HixIO.UserControl,
 		], function(Control) {
 			return new Control('#main');
 		});

 	/* Common controls, those with their own elements. */
 	HixIO.menu = new HixIO.Menu('#menu', {});
 	HixIO.message_box = new HixIO.MessageBox('#message_box', {});

 	/* Start the event loop. */
 	HixIO.boot();

 });
