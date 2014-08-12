/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

HixIO.attr('user', new can.Map({}));

/*
 * Provide a list of quick links to add content and provide a summary of what's
 * already there.
 */
HixIO.DashControl = can.Control.extend({
	defaults: {
		view: 'admin/dash'
	}
}, {
	'dash route': function() {
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
		detail: 'admin/post',
	}
}, {
	'posts route': function() {
		var self;

		self = this;

		HixIO.Post.list().success(function(data) {
			can.each(data.posts, function(post,i) {
				post.title = $('<a></a>').attr('href', '#!posts/' + post.id).html(post.title).prop('outerHTML');
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
				self.options.detail,
				{
					post: post,
					update_post: self.update_post,
					destroy_post: self.destroy_post
				}
			));
		});
	},

	update_post: function(context, event, element) {
		var post;

		post = context.post;
		post.save(function(data) {		
			HixIO.redirect('posts');
			HixIO.notify('Post #' + post.id + ' saved.', 'success-message');
		}, function(data) {
			HixIO.notify("Woops. I couldn\'t save post id #" + post.id + ".", 'error-message');
		});
	},

	destroy_post: function(context, event, element) {
		var post;

		post = context.post;
		post.destroy(function(data) {
			HixIO.redirect('posts');
			HixIO.notify('Post #' + post.id + ' destroyed.', 'success-message');
		}, function(data) {
			HixIO.notify("Woops. I couldn\'t destroy post id #" + post.id + ".", 'error-message');
		});
	}

});

/*
 * A control for a shared photo timeline.
 */
HixIO.PicsControl = can.Control.extend({}, {
	'pics route': function() {
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
	}
}, {
	init: function(element, options) {
		var self;
		self = this;

		this.user = new HixIO.User();
		this.errors = new can.Map({});

		this.user.attr(HixIO.attr('user').attr());
		this.user.bind('change', function(event, attr, how, new_value, old_value) {
			self.validate();
		});
	},
	'profile route': function () {
		this.element.html(HixIO.view(this.options.view, {
			user: this.user,
			errors: this.errors,
			update_profile: this.update_profile
		}));

		this.element.find(':submit').attr('disabled', 'disabled');
	},

	validate: function() { this.errors.attr(this.user.errors(), true); },

	update_profile: function(context, element, event) {
		var user;

		if(!this.user.errors()) {
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

	//TODO: convert this to a can-event attribute.
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

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {

	HixIO.message_bar = new HixIO.MessageBar('#messages');

	HixIO.menu = new HixIO.Menu('#menu', {
		view: 'admin/menu',
		selected_class: 'pure-menu-selected'
	});

	/*
	 * FIXME: Re-do auth. It should be a simple modal dialog or redirect on page
	 * load, before building controls and before can.route.ready().
	 */

	can.each([
		HixIO.DashControl,
		HixIO.PicsControl,
		HixIO.PostControl,
		HixIO.ProfileControl,
		HixIO.URLControl
	], function(Control) {
		return new Control('#main');
	});

	can.route.ready();

	if(!can.route.attr('route')) {
		can.route.attr({route: 'dash'}, true);
	}
});

