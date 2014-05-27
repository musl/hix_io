/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

/*
 * Provide a list of posts or details on a single post.
 */
HixIO.PostControl = can.Control.extend({}, {
	init: function(element, options) {
		var self;
	   	
		self = this;

		this.pager = new HixIO.Pager(this.element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#posts_pager'
		});
	},

	update: function() {
		var self, params;
	   
		self = this;
		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			self.element.html(can.view(
				'/static/templates/posts.stache',
				{ posts: HixIO.Post.models(data.posts) },
				HixIO.view_helpers
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
		var self = this;

		HixIO.Post.findOne({ id: data.id }, function(post) {
			self.element.html(can.view(
				'/static/templates/post.stache',
				{ post: post },
				HixIO.view_helpers
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
		view: '/static/templates/pics.stache'
	}
}, {
	'pics route': function(data) {
		this.element.html(can.view(this.options.view, {}));
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({}, {
	'urls route': function() {
		var self = this;
		
		HixIO.URL.list().success(function(data) {
			self.element.html(can.view('/static/templates/urls.stache', {
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
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			urls: HixIO.URLControl
		},
		default_route: 'posts'
	});

	HixIO.router.run();
});

