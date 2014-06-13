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
HixIO.PostControl = can.Control.extend({
	defaults: {
		view: 'admin/posts',
	}
}, {
	init: function() {
		can.route('posts/:id');
	},

	'posts route': function(data) {
		var self;
		
		self = this;

		HixIO.Post.list().success(function(data) {
			can.each(data.posts, function(post,i) {
				post.title = can.route.link(post.title, {id: post.id}, {}, false);
			});
			self.element.html(HixIO.view(
				self.options.view,
				{ posts: data.posts }
			));
		}).error(function(data) {
			HixIO.notify('There was a problem fetching the posts.', 'error-message');
		});
	},

	'posts/:id route': function(data) {
		var self;

		self = this;

		HixIO.Post.findOne({ id: data.id }, function(post) {
			self.element.html(HixIO.view(
				self.options.detail_view,
				{ post: post }
			));
		});
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
 * A control for modifying your profile data.
 */
HixIO.ProfileControl = can.Control.extend({
	defaults: {
		view: 'admin/profile',
		form: '#profile-form'
	}
}, {
	init: function(element, options) {
		this.user = new HixIO.User();
		this.errors = new can.Map({});
	},

	validate: function() {
		this.errors.attr(this.user.errors(), true);

		if(!this.user.errors()) {
			this.element.find(':submit').removeAttr('disabled');
		} else {
			this.element.find(':submit').attr('disabled', 'disabled');
		}
	},

	'profile route': function(data) {
		var self;
		self = this;

		this.user.attr(HixIO.attr('user').attr());
		this.user.bind('change', function(event, attr, how, new_value, old_value) {
			self.validate();
		});

		this.element.html(HixIO.view(this.options.view, {
			user: this.user,
			errors: this.errors
		}));

		this.element.find(':submit').attr('disabled', 'disabled');
	},

	'{form} submit': function(element, event) {
		var user;
		event.preventDefault();

		if(!this.user.errors()) {
			this.element.find(':submit').attr('disabled', 'disabled');
			user = HixIO.attr('user');

			user.attr(this.user.attr());
			user.attr('password', HixIO.sha512(user.attr('password')));
			user.removeAttr('verify_password');

			user.save(function(data) {
				HixIO.notify('Your profile has been updated.', 'success-message');
				user.removeAttr('password');
			},function(data) {
				HixIO.notify('There was a problem updating your profile.', 'error-message');
				user.removeAttr('password');
			});
		}
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({
	defaults: {
		view: 'admin/urls',
		field: '#shorten'
	}
}, {
	update: function() {
		var self;

		self = this;

		HixIO.ajax('/api/v1/urls')().success(function(urls) {
			self.element.html(HixIO.view(
				self.options.view,
				{
					url: self.url,
					urls: urls
				}
			));
		});
	},

	'urls route': function(data) {
		this.update();
	},

	'{field} keyup': function(element, event) {
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
		form: '#sign-in-form',
	}
},{
	init: function(element, options) {
		var self;

		self = this;
		this.redirect = null;
		this.credentials = new can.Map({});

		/*
		 * Don't bother trying to fetch the user if a session doesn't exist.
		 */
		if($.cookie(this.options.session_key)) {
			can.ajax({
				url: '/auth',
				type: 'GET',
				async: false,
				data: 'json'
			}).done(function(data) {
				HixIO.attr('user', HixIO.User.model(data));	
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
		var creds, params, self;

		self = this;
		creds = {
			email: this.credentials.email,
			password: HixIO.sha512(this.credentials.password),
		};

		HixIO.ajax('/auth', 'POST')(creds).success(function(data) {
			HixIO.attr('user', HixIO.User.model(data));	
			if(self.redirect) {
				HixIO.redirect(self.redirect);
				self.redirect = null;
			} else {
				can.route.attr('route', '');
			}
			HixIO.notify('You have signed in.', 'success-message');
			self.credentials.attr({}, true);
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
		HixIO.ajax('/auth', 'DELETE')().success(function(data) {
			HixIO.attr('user', null);
			HixIO.redirect();
			HixIO.notify('You have signed out.', 'success-message');
		}).error(function(data) {
			HixIO.notify('Woah. There was a problem signing out.', 'error-message');
		});
	},

	'sign-in route': function(data) {
		this.element.html(HixIO.view(this.options.view, {
			credentials: this.credentials,
			redirect: this.redirect
		}));
	},

	'sign-out route': function(data) {
		this.sign_out();
	},

	'{form} submit': function(element, event) {
		event.preventDefault();
		this.sign_in();
	}

});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.message_bar = new HixIO.MessageBar('#messages');

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

