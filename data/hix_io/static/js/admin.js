/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

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
		view: 'admin/profile'
	}
}, {
	'profile route': function(data) {
		this.element.html(HixIO.view(
			this.options.view,
			{
				user: HixIO.attr('user')
			}
		));
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
		HixIO.URL.list().success(function(data) {
			this.element.html(HixIO.view(
				this.options.view,
				{
					scheme: HixIO.meta.scheme,
					host: HixIO.meta.host,
					top_urls: HixIO.URL.models(data.top_urls),
					latest_urls: HixIO.URL.models(data.latest_urls),
					url: this.url,
				}
			));
		}.bind( this )).error(function(data) {
			HixIO.notify("Woah! Where'd my URLs go?", 'error-message');
		});
	},

	'urls route': function(data) {
		this.update();
	},

	'#shorten keyup': function(element, event) {
		if(event.keyCode === 13 && event.target.value !== '') {
			HixIO.URL.shorten({url: event.target.value}).success(function(data) {
				this.url = data;
				this.update();
			}.bind( this )).error(function(data) {
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
HixIO.AuthControl = can.Control.extend({
	defaults: {
		view: 'admin/login_form',
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

		this.require_auth = function() {
			if(!$.cookie('hix_io_session')) {
				HixIO.attr('user', null);
				can.route.attr('route', 'sign-in');
				return;
			}

			if(HixIO.attr('user') !== null) { return; }

			HixIO.ajax('/auth', 'GET')().success(function(data) {
				HixIO.attr('user', data); 
			}).error(function(data) {
				HixIO.attr('user', null);
				can.route.attr('route', 'sign-in');
			});
		};

		can.route.bind('route', function(event, new_value, old_value) {
			if(new_value === 'sign-in') { return; }
			self.require_auth();
		});

		this.submit = function() {
			var creds, email_field, password_field, sha, SHA;

			email_field = $(self.options.log_in_email);
			password_field = $(self.options.log_in_password);

			if(email_field.val() === '' || password_field.val() === '') { return; } 

			SHA = jsSHA;
			sha = new SHA( password_field.val(), "TEXT" );
			creds = {email: email_field.val(), password: sha.getHash(self.options.hash_algorithm, "HEX")};

			self.log_in(creds);
		};
	},

	log_in: function(params) {
		var self;

		self = this;

		HixIO.ajax('/auth', 'POST')(params).success(function(data) {
			HixIO.attr('user', data);
		}).error(function(data) {
			if(data.status === 401) {
				HixIO.notify('Invalid email or password.', 'warning-message');
			} else {
				HixIO.notify('Woah, there was a problem signing you in.', 'error-message');
			}
		});
	},

	log_out: function() {
		var self;

		self = this;

		HixIO.ajax('/auth', 'DELETE')().success(function(data) {
			HixIO.attr('user', null);
			self.require_auth();
		}).error(function(data) {
			HixIO.notify('Woah. There was a problem signing out.', 'error-message');
		});
	},

	update: function(data) {
		this.element.html(HixIO.view(
			this.options.view,
			{ user: HixIO.attr('user') }
		));
	},

	'sign-in route': function(data) {
		this.update();
	},

	'{log_in_button} click': function(element, event) {
		this.submit();
	},

	'{log_in_password} keyup': function(element, event) {
		if(event.keyCode === 13) { this.submit(); }
	},

	'{log_out_button} click': function(element, event) {
		this.log_out();	
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

	HixIO.router = new HixIO.Router('#main', {
		routes: {
			auth: HixIO.AuthControl,
			dash: HixIO.DashControl,
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			profile: HixIO.ProfileControl,
			urls: HixIO.URLControl
		},
		default_route: 'dash'
	});

	HixIO.router.run();
});

