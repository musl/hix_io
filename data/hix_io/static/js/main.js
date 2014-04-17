/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

/******************************************************************************/
// Namespace
/******************************************************************************/

var HixIO = {};

/******************************************************************************/
// Utility functions
/******************************************************************************/

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
};

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
};

/******************************************************************************/
// Models
/******************************************************************************/

/*
 * Posts for a blog.
 */
HixIO.Post = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/posts'),
	findOne: 'GET /api/v1/posts/{id}'
}, {});

/*
 * Posts for a blog.
 */
HixIO.URL = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/urls'),
	shorten: HixIO.asyncReq('/api/v1/urls', 'POST')
}, {});

/*
 * Search across all objects in the database.
 */
HixIO.Search = can.Model.extend({
	list:    HixIO.asyncReq('/api/v1/search')
}, {});

/******************************************************************************/
// Controls
/******************************************************************************/

/*
 * A reusable pager control.
 * 
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     target: (required)
 *         The selector that yields one element to render the pager into.
 *
 *     on_change: (required)
 *         The function you want called when the pager's page changes.
 *
 *     per_page: (optional)
 *         The number of items per page.
 *
 *     pad: (optional)
 *         The number of numbers to show on each side of the curent page in the
 *         pager.
 *
 */
HixIO.Pager = can.Control.extend({
	defaults: {
		view: '/templates/pager.ejs',
		target: null
	}
},{
	init: function(element, options) {
		var p;

		this.state = new can.Map({
			count: 0,
			per_page: 10,
			pages: 0, 
			page: 0,
			pad: 2
		});

		this.state.bind('page', options.on_change);

		/*
		 * The reason we need this is that the element won't exist when this control
		 * is created.
		 */
		this.options.target = options.target;

		p = parseInt(options.per_page, 10);
		if(p > 0) { this.options.per_page = p; }

		p = parseInt(options.pad, 10);
		if(p > 0) { this.options.pad = p; }
	},

	update: function(count) {
		var a, c, p, ds, de;

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
		var page = parseInt(el.attr('data-page'), 10);

		if(page >= 0 && page < this.state.pages) {
			this.state.attr('page', page);
		}
	}
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
			target: '#posts_pager'
		});

		can.route('posts');
		can.route('post/:id');
	},

	update: function() {
		var self = this;
		var params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			self.element.html(can.view('/templates/posts.ejs', {
				posts: HixIO.Post.models(data.posts)
			}));
			self.pager.update(data.count);
			HixIO.highlightSyntax();
		}).error(function(data) {
			HixIO.notify('Unable to load posts.', 'error-message');
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
			HixIO.highlightSyntax();
		});
	}
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
			target: '#search_pager'
		});

		can.route('search');
	},

	update: function() {
		var self = this;
		var params = this.pager.params({ q: this.q });

		HixIO.Search.list(params).success(function(data) {
			self.element.html(can.view('/templates/search.ejs', {
				posts: HixIO.Post.models(data.posts),
				q: self.q
			}));
			self.pager.update(data.count);
		}).error(function(data) {
			HixIO.notify('Unable to load search results.', 'error-message');
		});
	},

	'search route': function(data) {
		this.q = data.q;
		this.update();
	}
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
	}
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
				url: self.url
			}));
		}).error(function(data) {
			HixIO.notify("Woah! Where'd my URLs go?", 'error-message');
		});
	},

	'urls route': function() {
		this.update();
	},

	'#shorten keyup': function(el,e) {
		var self = this;

		if(e.keyCode === 13 && e.target.value !== '') {
			HixIO.URL.shorten({url: e.target.value}).success(function(data) {
				self.url = data;
				self.update();
			}).error(function(data) {
				HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
			});
		}
	}
});

/*
 * An application menu.
 *
 * This control listens to route changes and updates the classes of menu items
 * to match the route.
 *
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     selected_class: (optional)
 *         The class to add or remove based on whether the route is matches the
 *         link's path.
 *
 */
HixIO.MenuControl = can.Control.extend({
	defaults: {
		selected_class: 'pure-menu-selected'
	}
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
	}
});

/*
 * A message bar.
 *
 * Use notify to show a message that will close itself after a while. That
 * function takes an object as its only argument. What properties must be
 * defined on that object depend on the template consumes the object.
 *
 * The default template needs:
 *
 *     message: (required)
 *         The message to display.
 *     
 *     message_class: (required)
 *         The CSS class to add to this control's element.
 *
 * This control really only cares about the following optional property on each
 * message object, which is available whatever template you use:
 *
 *     timeout: (optional)
 *         Override the control's default message timeout.
 *
 * The default template allows HTML in the message and won't escape it. You may
 * even render templates and pass the resulting string in. As you wish.
 *
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     timeout: (optional)
 *         A number of seconds to wait before closing the notification.
 *         Decimals are okay.
 *
 *     persist: (optional)
 *         True or False. Do we keep the notification up if the route changes?
 *
 *     view: (optional)
 *         Override the view to render.
 *
 *     close: (optional)
 *         This control will close on click events on child elements that match
 *         this selector.
 *
 * Ideas:
 *     - per-message persist option
 *     - options to disable or change FX
 *
 */
HixIO.MessageControl = can.Control.extend({
	defaults: {
		timeout: 10.0,
		persist: false,
		view: '/templates/message.ejs',
		close: '.close-button'
	}
},{
	init: function(element, options) {
		var i;
		var self = this;

		if(options.view) { this.options.view = options.view; }
		if(options.persist) { this.options.persist = true; }

		i = parseInt(options.timeout, 10);
		if(i > 0) { this.options.timeout = i; }

		/*
		 * Close this control on route changes, unless the persist option is set.
		 */
		can.route.bind('route', function(i,e) {
			if(!self.persist) { self.close(); }
		});
	},

	/*
	 * Show a new message or interrupt the currently displayed message.
	 */
	notify: function(message) {
		var self = this;
	
		// Don't speak unless you've got something to say.	
		if(!message) { return; }

		this.message = message;
		
		// Interrupt the current message.
		if(this.element.is(':visible')) {
			clearTimeout(this.timeout);

			this.element.fadeOut('fast', function() {
				self.update();
				self.element.fadeIn('fast');
			});
			return;
		}

		this.update();
		this.element.slideDown('fast');	
	},

	/*
	 * Render the template and hook up the close timeout.
	 */
	update: function() {
		var self = this;
		var timeout,t;

		// Don't render the view if there's nothing to say.
		if(!this.message) { return; }

		// Don't update the view if it's visible.
		if(this.timeout || this.element.is(':visible')) { return; }

		// Gah. JavaScript, you suck.
		timeout = this.options.timeout;
		t = parseInt(this.message.timeout, 10);
		if( t > 0 ) { timeout = t; }
		timeout = Math.floor(timeout * 1000);

		this.element.html(can.view(this.options.view, this.message));
		this.timeout = setTimeout(function() { self.close(); }, timeout);
	},

	/*
	 * Hide and reset this control.
	 */
	close: function() {
		var self = this;

		clearTimeout(this.timeout);
		this.timeout = null;

		this.element.slideUp('slow', function() {
			self.element.clearQueue();
			self.element.empty();
			self.message = null;
		});
	},

	// Hook up the close event.
	'{close} click': function(el, ev) { this.close(); }
});

/*
 * An application router.
 * 
 * This control is responsible for loading all of the controls that may want to
 * write to the main content area for the application.
 *
 * This router also provides a 'default route' by redirecting an empty route to
 * the configured default.
 * 
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     default_route: (optional)
 *         The hash string to redirect to if the route is empty.
 *
 *     main: (optional)
 *         The element to use when creating controls. The router should be
 *         created with document.body so that it can handle app-wide events.
 *
 */
HixIO.Router = can.Control.extend({
	defaults: {
		main: '#main',
		default_route: 'posts'
	}
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
		this.controls = [];
		this.controls.push(new HixIO.SearchControl(this.options.main));
		this.controls.push(new HixIO.PostControl(this.options.main));
		this.controls.push(new HixIO.CodeControl(this.options.main));
		this.controls.push(new HixIO.URLControl(this.options.main));

		/*
		 * All routes get defined in each control's init method, all of the routes we
		 * need should be ready by now.
		 */
		can.route.ready();

		/*
		 * Direct the browser to the default route.
		 */
		if(!can.route.attr('route') ||
		   can.route.attr('route') === '') {
			can.route.attr('route', this.options.default_route);
		}
	},

	/*
	 * Handle the search event globally.
	 */
	'#search keyup': function(el,e) {
		if(e.keyCode === 13) {
			window.location.hash = can.route.url({route: 'search', q: e.target.value});
		}
	}
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

	/*
	 * Convenience method for notifications. HMmmm.
	 */
	HixIO.notify = function (m,c,t) {
		HixIO.message_control.notify({
			message: m,
			message_class: c,
			timeout: t
		});
	};
});

