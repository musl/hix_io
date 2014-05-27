/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Auth
 ******************************************************************************/

HixIO.on_auth_change = function(callback) { HixIO.bind('user', callback); };

HixIO.get_auth = function() {
	var deferral;

	deferral = can.Deferred();

	if(!$.cookie('hix_io_session')) {
		HixIO.attr('user', null);
		deferral.resolve();
		return deferral.promise();
	}

	HixIO.ajax('/auth', 'GET')().success(function(data) {
		HixIO.attr('user', data); 
		deferral.resolve();
	}).error(function(data) {
		HixIO.attr('user', null);
		deferral.resolve();
	});

	return deferral.promise();
};

HixIO.log_in = function(params) {
	HixIO.ajax('/auth', 'POST')(params).success(function(data) {
		HixIO.attr('user', data);
		HixIO.notify('You have signed in.', 'success-message');
	}).error(function(data) {
		if(data.status === 401) {
			HixIO.notify('Invalid email or password.', 'warning-message');
		} else {
			HixIO.notify('Woah, there was a problem signing you in.', 'error-message');
		}
	});
};

HixIO.log_out = function() {
	HixIO.ajax('/auth', 'DELETE')().success(function(data) {
		HixIO.attr('user', null);
		HixIO.notify('You have signed out.', 'success-message');
	}).error(function(data) {
		HixIO.notify('Woah. There was a problem signing out.', 'error-message');
	});
};

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

/*
 * Provide a list of quick links to add content and provide a summary of what's
 * already there.
 */
HixIO.DashControl = can.Control.extend({}, {
	'dash route': function(data) {
		this.element.html(can.route.attr('route'));
	},

	'dash/:id route': function(data) {
		this.element.html(can.route.attr('route'));
	}
});

/*
 * Provide a list of posts or details on a single post.
 */
HixIO.PostControl = can.Control.extend({}, {
	'posts route': function(data) {
		this.element.html(can.route.attr('route'));
	},

	'posts/:id route': function(data) {
		this.element.html(can.route.attr('route'));
	}
});

/*
 * A control for a shared photo timeline.
 */
HixIO.PicsControl = can.Control.extend({}, {
	'pics route': function(data) {
		this.element.html(can.route.attr('route'));
	},

	'pics/:id route': function(data) {
		this.element.html(can.route.attr('route'));
	}
});

/*
 * A control for a shared photo timeline.
 */
HixIO.ProfileControl = can.Control.extend({
	defaults: {
		view: '/static/templates/admin/profile.stache'
	}
}, {
	'profile route': function(data) {
		this.element.html(can.view(this.options.view, {
			user: HixIO.attr('user')
		}));
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({}, {
	init: function(element, options) {
		var self;

		self = this;
	},

	update: function() {
		var self = this;
		
		HixIO.URL.list().success(function(data) {
			self.element.html(can.view('/static/templates/admin/urls.stache', {
				scheme: HixIO.meta.scheme,
				host: HixIO.meta.host,
				top_urls: HixIO.URL.models(data.top_urls),
				latest_urls: HixIO.URL.models(data.latest_urls),
				url: self.url,
			},
			HixIO.view_helpers));
		}).error(function(data) {
			HixIO.notify("Woah! Where'd my URLs go?", 'error-message');
		});
	},

	'urls route': function(data) {
		this.update();
	},

	'#shorten keyup': function(element, event) {
		var self = this;

		if(event.keyCode === 13 && event.target.value !== '') {
			HixIO.URL.shorten({url: event.target.value}).success(function(data) {
				self.url = data;
				self.update();
			}).error(function(data) {
				if(data.status === 403) {
					HixIO.notify('You aren\'t allowed to shorten urls.', 'error-message');
				} else if(data.status === 401) {
					HixIO.notify('You need to log in to shorten URLs.', 'info-message');
				} else {
					HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
				}
			});
		}
	}
});

/*
 * An auth control.
 */
HixIO.LoginForm = can.Control.extend({
	defaults: {
		view: '/static/templates/admin/login_form.stache',
		log_in_button: '#log-in-button',
		log_out_button: '#log-out-button',
		log_in_email: '#log-in-email',
		log_in_password: '#log-in-password',
		hash_algorithm: 'SHA-512'
	}
},{
	init: function(element, options) {
		var self;

		self = this;

		HixIO.on_auth_change(function() { self.update(); });
		this.element.hide();

		this.submit = function() {
			var creds, email_field, password_field, sha, SHA;

			email_field = $(this.options.log_in_email);
			password_field = $(this.options.log_in_password);

			if(email_field.val() === '' || password_field.val() === '') { return; } 

			SHA = jsSHA;
			sha = new SHA( password_field.val(), "TEXT" );
			creds = {email: email_field.val(), password: sha.getHash(this.options.hash_algorithm, "HEX")};

			HixIO.log_in(creds);
		};
	},

	update: function() {
		var self,render;
	
		self = this;
		render = function() {
			self.element.html(can.view(self.options.view, {
				user: HixIO.attr('user')
			}));
			self.element.fadeIn('fast');
		};

		if(this.element.is(':visible')) {
			this.element.fadeOut('fast', function() {
				render();
			});
			return;
		}

		render();
	},

	'{log_in_button} click': function(element, event) {
		this.submit();
	},

	'{log_in_password} keyup': function(element, event) {
		if(event.keyCode === 13) { this.submit(); }
	},

	'{log_out_button} click': function(element, event) {
		HixIO.log_out();	
	}

});


/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.message_bar = new HixIO.MessageBar('#messages');
	HixIO.delegate('notify', HixIO.message_bar);

	HixIO.link_highlighter = new HixIO.LinkHighlighter('#menu', {
		selected_class: 'pure-menu-selected'
	});

	HixIO.login_form = new HixIO.LoginForm('#login-form');

	HixIO.router = new HixIO.Router('#main', {
		routes: {
			dash: HixIO.DashControl,
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			profile: HixIO.ProfileControl,
			urls: HixIO.URLControl
		},
		default_route: 'dash'
	});

	HixIO.get_auth().done(function() { HixIO.router.run(); });
});

