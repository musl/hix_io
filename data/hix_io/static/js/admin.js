/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/*
 * Provide a list of quick links to add content and provide a summary of what's
 * already there.
 */
HixIO.DashControl = can.Control.extend({
	defaults: {
		view: 'admin/dash'
	}
}, {
	'dash route': function(data) {
		var self;

		self = this;

		HixIO.Meta.dash().success(function(data){
			self.element.html(HixIO.view(self.options.view, data));
		});
	},
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
		view: 'admin/profile'
	}
}, {
	'profile route': function(data) {
		this.element.html(HixIO.view(this.options.view, HixIO.attr('user')));
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({
	defaults: {
		view: 'admin/urls'
	}
}, {
	update: function() {
		var self;

		self = this;
		HixIO.URL.list().success(function(data) {
			self.element.html(HixIO.view(
				self.options.view,
				{
					scheme: HixIO.meta.scheme,
					host: HixIO.meta.host,
					top_urls: HixIO.URL.models(data.top_urls),
					latest_urls: HixIO.URL.models(data.latest_urls),
					url: self.url,
				}
			));
		});
	},

	'urls route': function(data) {
		this.update();
	},

	'#shorten keyup': function(element, event) {
		var self;
	   
		self = this;

		if(event.keyCode === 13 && event.target.value !== '') {
			HixIO.URL.shorten({url: event.target.value}).success(function(data) {
				self.url = data;
				self.update();
			}).error(function(data) {
				if(data.status === 403) {
					HixIO.notify('You aren\'t allowed to shorten urls.', 'error-message');
				} else if(data.status === 401) {
					HixIO.notify('You need to sign in to shorten URLs.', 'info-message');
				} else {
					HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
				}
			});
		}
	}
});

/*
 * An auth control.
 *
 * Options:
 *
 *     session_key (required):
 *         The name of the cookie to check for that represents the presence of
 *         a session.
 *
 *     view (optional):
 *         The name of the template to use.
 *
 *     TODO: Document options.
 *
 */
HixIO.AuthControl = can.Control.extend({
	defaults: {
		view: 'admin/sign_in',
		sign_in_button: '#sign-in-button',
		sign_out_button: '#sign-out-button',
		sign_in_email: '#sign-in-email',
		sign_in_password: '#sign-in-password',
		hash_algorithm: 'SHA-512'
	}
},{
	init: function(element, options) {
		var self;

		self = this;
		this.redirect = null;

		/*
		 * Don't bother fetching the user if a session doesn't exist.
		 */
		if($.cookie(this.options.session_key)) {
			can.ajax({
				url: '/auth',
				type: 'GET',
				async: false,
				data: 'json'
			}).done(function(data) {
				HixIO.attr('user', data);	
			});
		}
	},

	check: function(route) {
		if(route === 'sign-in' || route === 'sign-out' ) { return route; }
		if(!HixIO.attr('user')) {
			this.redirect = route;
			return 'sign-in';
		}
		return route;
	},

	sign_in: function() {
		var creds, email_field, params, password_field, self, sha, SHA;

		self = this;
		email_field = $(this.options.sign_in_email);
		password_field = $(this.options.sign_in_password);

		if(email_field.val() === '' || password_field.val() === '') { return; } 

		SHA = jsSHA;
		sha = new SHA( password_field.val(), "TEXT" );
		creds = {
			email: email_field.val(),
			password: sha.getHash(this.options.hash_algorithm, "HEX")
		};

		HixIO.ajax('/auth', 'POST')(creds).success(function(data) {
			HixIO.attr('user', data);	
			if(self.redirect) {
				can.route.attr('route', self.redirect);
				self.redirect = null;
			} else {
				can.route.attr('route', '');
			}
			HixIO.notify('You have signed in.', 'success-message');
		}).error(function(data) {
			if(data.status >= 400 && data.status < 500) {
				HixIO.notify('Invalid email or password.', 'warning-message');
			}
			if(data.status >= 500 && data.status < 600) {
				HixIO.notify('', 'error-message');
			}
		});
	},

	sign_out: function() {
		var self;

		self = this;

		HixIO.ajax('/auth', 'DELETE')().success(function(data) {
			HixIO.attr('user', null);
			HixIO.router.redirect();
			HixIO.notify('You have signed out.', 'success-message');
		}).error(function(data) {
			HixIO.notify('Woah. There was a problem signing out.', 'error-message');
		});
	},

	'sign-in route': function(data) {
		this.element.html(HixIO.view(this.options.view, {
			redirect: this.redirect
		}));
	},

	'sign-out route': function(data) {
		this.sign_out();
	},

	'{sign_in_button} click': function(element, event) {
		this.sign_in();
	},

	'{sign_in_password} keyup': function(element, event) {
		if(event.keyCode === 13) { this.sign_in(); }
	},

});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.message_bar = new HixIO.MessageBar('#messages');
	HixIO.delegate('notify', HixIO.message_bar);

	HixIO.menu = new HixIO.Menu('#menu', {
		view: 'admin/menu',
		selected_class: 'pure-menu-selected'
	});

	HixIO.router = new HixIO.Router('#main', {
		routes: {
			dash: HixIO.DashControl,
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			profile: HixIO.ProfileControl,
			urls: HixIO.URLControl
		},
		default_route: 'dash',
		auth_control: new HixIO.AuthControl('#main', {
			session_key: 'hix_io_session'
		})
	});

	HixIO.router.run();
});

