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
		this.pager = new HixIO.Pager(this.element, {
			per_page: 5,
			on_change: function() { this.update(); }.bind( this ),
			target: '#posts_pager'
		});
	},

	update: function() {
		var params;
	   
		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			this.element.html(HixIO.view(
				this.options.list_view,
				{ posts: HixIO.Post.models(data.posts) }
			));
			this.pager.update(data.count);
			HixIO.highlightSyntax();
		}.bind( this )).error(function(data) {
			HixIO.notify('Unable to load posts.', 'error-message');
		});
	},

	'posts route': function(data) {
		this.update();
	},

	'posts/:id route': function(data) {
		HixIO.Post.findOne({ id: data.id }, function(post) {
			this.element.html(HixIO.view(
				this.options.detail_view,
				{ post: post }
			));
			HixIO.highlightSyntax();
		}.bind( this ));
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
	'urls route': function() {
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
	}
});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	HixIO.message_bar = new HixIO.MessageBar('#messages');
	HixIO.delegate('notify', HixIO.message_bar);

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

	HixIO.router.run();
});

