/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

/******************************************************************************/
// Namespace
/******************************************************************************/

HixIO = {};

/******************************************************************************/
// Utility functions
/******************************************************************************/

/*
 * Display a notification.
 */
HixIO.notify = function(message, message_class, timeout) { 
	HixIO.message_control.notify(message, message_class, timeout);
}

/*
 * For all 'code' elements nested within 'pre' elements:
 *
 * - If the attribute 'data-language' is defined and Highlight.js recognizes
 *   the given value as a language, highlight the element.
 *
 * - If the attribute 'data-language' is not defined, have Highlight.js guess
 *   at the language and highlight the element.
 */
HixIO.highlightSyntax = function() {
	$('pre code').each(function(i, e) {
		var el = $(e);
		var lang = el.attr('data-language');

		if(!lang) {
			hljs.highlightBlock(e);
		} else if(hljs.getLanguage(lang)) {
			el.html(hljs.highlight(lang, el.html(), true));
		}
	});
}

/*
 * Perform an asynchronous HTTP request and return the deferred result.
 */
HixIO.asyncReq = function(path, method, type) {
	if(!method) { method = 'GET'; }
	if(!type) { type = 'json'; }

	return function(params) {
		return can.ajax({
			url: path,
			type: method,
			data: params,
			dataType: type
		});
	};
}

/******************************************************************************/
// Models
/******************************************************************************/

/*
 * Posts for a blog.
 */
HixIO.Post = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/posts'),
	findOne: 'GET /api/v1/posts/{id}',
}, {});

/*
 * Posts for a blog.
 */
HixIO.URL = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/urls'),
	shorten: HixIO.asyncReq('/api/v1/urls', 'POST'),
}, {});

/*
 * Search across all objects in the database.
 */
HixIO.Search = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/search'),
}, {});

/******************************************************************************/
// Controls
/******************************************************************************/

/*
 * A reusable pager control.
 *
 *     target: (required)
 *         The selector that yields one element to render the pager into.
 *
 *     on_change: (required)
 *         The function you want called when the pager's page changes.
 *
 *     per_page: (optional, default: 10)
 *         The number of items per page.
 *
 *     pad: (optional, default: 2)
 *         The number of numbers to show on each side of the curent page in the
 *         pager.
 *
 */
HixIO.Pager = can.Control.extend({
	defaults: {
		view: '/templates/pager.ejs',
		target: null,
	},
},{
	init: function(element, options) {
		this.state = new can.Map({
			count: 0,
			per_page: 10,
			pages: 0, 
			page: 0,
			pad: 2,
		});

		this.state.bind('page', options.on_change);

		/*
		 * The reason we need this is that the element won't exist when this control
		 * is created.
		 */
		this.options.target = options.target;

		p = parseInt(options.per_page);
		if(p > 0) { this.options.per_page = p; }

		p = parseInt(options.pad);
		if(p > 0) { this.options.pad = p; }
	},

	update: function(count) {
		this.state.attr('count', count);
		this.state.attr('pages', Math.ceil(this.state.count / this.state.per_page));

		p = this.state.attr('page');
		c = this.state.attr('pages');
		a = this.state.attr('pad');

		/*
		 * Find the ammount we need to extend each side of the window to account for
		 * collapses on the opposite side. This allows for a roughly constant-width
		 * control.
		 */
		ds = Math.min(0, c - (p + a) - 1);	
		de = Math.max(0, -1 * (p - a)) + 1;

		/*
		 * Calculate and store the indexes for the window.
		 */
		this.state.attr('window_start', Math.max(0, p - a + ds));
		this.state.attr('window_end', Math.min(c, p + a + de));

		$(this.options.target).html(can.view(this.options.view, this.state));
	},

	params: function(params) {
		if(!params) { params = {}; }
		params.offset = this.state.page * this.state.per_page;
		params.limit = this.state.per_page;
		return params;
	},

	'{target} a click': function(el, ev) {
		var page = parseInt(el.attr('data-page'));

		if(page >= 0 && page < this.state.pages) {
			this.state.attr('page', page);
		}
	},
});

/*
 * Provide a list of posts or details on a single post.
 */
HixIO.PostControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.pager = new HixIO.Pager(element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#posts_pager',
		});

		can.route('posts');
		can.route('post/:id');
	},

	update: function() {
		var self = this;

		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			self.element.html(can.view('/templates/posts.ejs', {
				posts: HixIO.Post.models(data.posts),
			}));
			self.pager.update(data.count);
			highlightSyntax();
		}).error(function(data) {
			// FIXME Error handling.
		});
	},

	'posts route': function() {
		this.update();
	},

	'posts/:id route': function(data) {
		var self = this;

		HixIO.Post.findOne({ id: data.id }, function(post) {
			self.element.html(can.view('/templates/post.ejs', {
				post: post
			}));
			highlightSyntax();
		});
	},
});

/*
 * Provide a control for displaying search results.
 */
HixIO.SearchControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.q = null;
		this.pager = new HixIO.Pager(element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#search_pager',
		});

		can.route('search');
	},

	update: function() {
		var self = this;

		params = this.pager.params({ q: this.q });

		HixIO.Search.list(params).success(function(data) {
			self.element.html(can.view('/templates/search.ejs', {
				posts: HixIO.Post.models(data.posts),
				q: self.q,
			}));
			self.pager.update(data.count);
		}).error(function(data) {
			// FIXME Error handling.
		});
	},

	'search route': function(data) {
		this.q = data.q;
		this.update();
	},
});

/*
 * A control for listing and displaying projects.
 */
HixIO.CodeControl = can.Control.extend({}, {
	init: function() {
		can.route('code');
	},

	'code route': function() {
		this.element.html('code');
	},
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({}, {
	init: function() {
		can.route('urls');
	},

	update: function() {
		var self = this;

		HixIO.URL.list().success(function(data) {
			self.element.html(can.view('/templates/urls.ejs', {
				top_urls: HixIO.URL.models(data.top_urls),
				latest_urls: HixIO.URL.models(data.latest_urls),
			}));
		}).error(function(data) {
			// FIXME Error handling.
		});
	},

	'urls route': function() {
		this.update();
	},

	'#shorten keyup': function(el,e) {
		var self = this;

		if(e.keyCode == 13) {
			console.log(e.target.value);
			HixIO.URL.shorten({url: e.target.value}).success(function(data) {
				self.update();
				HixIO.notify('Shortened url: http://hix.io/' + data.short , 'success-message', 0);
			}).error(function(data) {
				HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
			});
		}
	},
});

/*
 * A control to update the menu based on the hash.
 */
HixIO.MenuControl = can.Control.extend({
	defaults: {
		selected_class: 'pure-menu-selected',
	},	
}, {
	init: function(element, options) {
		var self = this;

		if(options.selected_class) {
			this.options.selected_class = options.selected_class;
		}
		can.route.bind('route', function() { self.update(); });
	},

	update: function() {
		var self = this;

		$(this.element).find('a').each(function(i,e) {
			if(e.href.match(new RegExp(can.route.attr('route') + '$'))){ 
				$(e).parent().addClass(self.options.selected_class);
			} else {
				$(e).parent().removeClass(self.options.selected_class);
			}
		});
	},
});

/*
 * A message bar.
 */
HixIO.MessageControl = can.Control.extend({
	defaults: {
		timeout: 5000, // milliseconds
	},
},{
	init: function(element, options) {
		var self = this;

		this.element.hide();

		this.stack = new can.List();
		this.stack.bind('add', function() {
			if(self.stack.length == 0) { return; }
			if(self.element.is(':visible')) { return; }
			self.update();
			self.element.slideDown('fast');
		});
	},

	update: function() {
		var self = this;
		var obj = this.stack.shift();
		var timeout = this.options.timeout;

		this.element.html(can.view('/templates/message.ejs', obj));
		
		/*
		if(obj.timeout) {
			console.log(obj.timeout);
			if(obj.timeout == 0) {
				console.log('NO TIMEOUT');
				while(this.stack.length > 0) {
					this.stack.pop();
				}
				return;
			} else {
				timeout = obj.timeout;
			}
		}
	    */

		setTimeout( function() {
			if(self.stack.length > 0 ){
				self.element.fadeOut( 'fast', function() {
					self.update();
					self.element.fadeIn( 'fast' );
				});
			}else{
				self.element.slideUp('slow');
			}
		}, timeout );
	},

	notify: function(message, message_class, timeout) {
		console.log(timeout);
		this.stack.push({
			message: message,
			message_class: message_class,
			timeout: timeout,
		});
	},
});

/*
 * Setup the initial environment, route requests to control, and handle
 * events for the whole document.
 *
 * TODO - tie routes, controls, and the menu together with an associative
 * arrray. Bonus points for some way of registering controls so that we don't
 * have to maintain the menu or list of controls.
 *
 */
HixIO.Router = can.Control.extend({
	defaults: {
		main: '#main',
		default_route: 'posts',
	},
}, {
	init: function(element, options) {
	/*
	 * Handle options.
	 */
		if(options.main) { this.options.main = options.main; }
		if(options.menu) { this.options.menu = options.menu; }
		if(options.default_route) { this.options.default_route = options.default_route; }

		/*
		 * Instantiate all of the controls. This assumes that nobody's doing anything
		 * stupid inside of init methods, like making http calls, writing to the main
		 * element, etc.
		 */

		new HixIO.SearchControl(this.options.main);
		new HixIO.PostControl(this.options.main);
		new HixIO.CodeControl(this.options.main);
		new HixIO.URLControl(this.options.main);

		/*
		 * All routes get defined in each control's init method, all of the routes we
		 * need should be ready by now.
		 */
		can.route.ready();

		/*
		 * Direct the browser to the default route.
		 */
		if(!can.route.attr('route') ||
		   can.route.attr('route') == '') {
			can.route.attr('route', this.options.default_route);
		}
	},

	/*
	 * Handle the search event globally.
	 */
	'#search keyup': function(el,e) {
		if(e.keyCode == 13) {
			window.location.hash = can.route.url({route: 'search', q: e.target.value});
		}
	},
});

/******************************************************************************/
// Entry point.
/******************************************************************************/

/*
 * Start up the main router.
 */
$(document).ready(function() {
	HixIO.router = new HixIO.Router(document.body);
	HixIO.menu = new HixIO.MenuControl('#menu');
	HixIO.message_control = new HixIO.MessageControl('#messages');
});

