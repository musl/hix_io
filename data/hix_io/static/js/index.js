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
		detail_view: 'post',
		search_view: 'post_search'
	}
}, {
	'posts route': function(data) {
		var self;

		self = this;

		HixIO.Post.findAll({}, function(posts) {
			self.element.html(HixIO.view(
				self.options.list_view,
				{ posts: posts, search: self.search }
			));
			HixIO.highlightSyntax();
		}, function(data) {
			HixIO.notify('Unable to load the list of posts.', 'error-message');
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
			HixIO.highlightSyntax();
		});
	},

	'posts/search/ route': function(data) {
		var self;

		self = this;

		HixIO.Post.search({
			q: data.q
		}).success(function(posts) {
			self.element.html(HixIO.view(
				self.options.search_view,
				/* WTF. I thought that {{#if <key>}} would evaluate to false if the key was falsy. */
			   	{ posts: posts.length > 0 ? posts : false, q: data.q, search: self.search }
			));
			HixIO.highlightSyntax();
		}).error(function(data) {
			HixIO.notify('Unable to search posts.', 'error-message');
		});
	},

	search: function(event, element) {
		can.route.attr({route: 'posts/search/', q: element.val()});
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
	'pics route': function() {
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

	can.each([
		HixIO.PicsControl,
		HixIO.PostControl,
		HixIO.URLControl
	], function(Control) {
		return new Control('#main');
	});

	can.route.ready();

	if(!can.route.attr('route')) {
		can.route.attr({route: 'posts'}, true);
	}

});

