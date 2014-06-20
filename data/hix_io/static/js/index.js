/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

/*
 * Provide a list of posts or details on a single post.
 */
HixIO.PostControl = can.Control.extend({
	defaults: {
		list_view: 'posts',
		detail_view: 'post'
	}
}, {
	init: function(element, options) {
		var self;

		self = this;

		this.pager = new HixIO.Pager(this.element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#posts_pager'
		});

		can.route('posts');
		can.route('posts/:id');
	},

	update: function() {
		var params, self;
	   
		self = this;
		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			window.post_data = data;
			self.element.html(HixIO.view(
				self.options.list_view,
				{ posts: HixIO.Post.models(data.posts) }
			));
			self.pager.update(data.count);
			HixIO.highlightSyntax();
		}).error(function(data) {
			HixIO.notify('Unable to load posts.', 'error-message');
		});
	},

	'posts route': function(data) {
		this.update();
	},

	'posts/:id route': function(data) {
		var self;

		self = this;

		HixIO.Post.findOne({ id: data.id }, function(post) {
			self.element.html(HixIO.view(
				self.options.detail_view,
				{ post: post }
			));
			HixIO.highlightSyntax();
		});
	}
});

/*
 * A control for a shared photo timeline.
 */
HixIO.PicsControl = can.Control.extend({
	defaults: {
		view: 'pics'
	}
}, {
	init: function() {
		can.route('pics');
	},

	'pics route': function(data) {
		this.element.html(HixIO.view(
			this.options.view,
			{}
		));
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
		can.route('urls');
	},

	'urls route': function() {
		var self;

		self = this;

		HixIO.URL.summary().success(function(data) {
			self.element.html(HixIO.view(
				self.options.view,
				{
					scheme: HixIO.attr('meta').scheme,
					host: HixIO.attr('meta').host,
					top_urls: HixIO.URL.models(data.top_urls),
					latest_urls: HixIO.URL.models(data.latest_urls),
					url: self.url,
				}
			));
		}).error(function(data) {
			HixIO.notify("Woah! Where'd my URLs go?", 'error-message');
		});
	}
});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.message_bar = new HixIO.MessageBar('#messages');

	HixIO.menu = new HixIO.Menu('#menu', {
		selected_class: 'pure-menu-selected'
	});

	HixIO.router = new HixIO.Router('#main', {
		routes: {
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			urls: HixIO.URLControl
		},
		default_route: 'posts'
	});
});

