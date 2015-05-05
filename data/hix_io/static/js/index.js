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

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({
	defaults: {
		view: 'urls'
	}
}, {
	init: function() {
		var self;

		self = this;

		HixIO.bind('user', function() { self.update(); });
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
			console.log("Error fetching URLs. Status: " + data.status);
			self.element.html('Error fetching URLs.');
		});
	},

	'urls route': function() {
		this.update();
	},

	shorten: function(context, element, event) {
		var self;

		self = this;

		HixIO.URL.shorten({url: element[0].value}).success(function(data) {
			self.url = data;
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
			logout: this.logout,
			login: this.login,
			user: HixIO.attr('user')
		}));
		console.log('menu updated')
	},

	logout: function() {
		var self;

		self = this;

		console.log('logout');

		HixIO.ajax('/auth/', 'DELETE')().success(function(data) {
			HixIO.attr('user', false);
		}).error(function(data) {
			console.log('Could not log out: ' + data.status);
		});
	},

	login: function() {
		var self;

		self = this;

		console.log('login');

		HixIO.ajax('/auth/', 'POST')({
			email: 'm@hix.io',
			password: 'test'
		}).success(function(data) {
			HixIO.attr('user', HixIO.User.model(data));
		}).error(function(data) {
			console.log('Could not log in: ' + data.status);
		});
	}
});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.menu = new HixIO.Menu('#menu', {});
	can.each([
		HixIO.DefaultControl,
		HixIO.URLControl
	], function(Control) {
		return new Control('#main');
	});
	HixIO.boot();
});

