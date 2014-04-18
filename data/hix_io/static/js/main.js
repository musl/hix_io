/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************/
// Namespace
/******************************************************************************/

var HixIO = {};

/******************************************************************************/
// Utility functions
/******************************************************************************/

/*
 * Attempt to syntax-highlight all 'code' elements nested within 'pre'
 * elements.
 *
 * If the attribute 'data-language' is defined and Highlight.js recognizes
 * the given value as a language, highlight the element as the given language.
 *
 * If the 'data-language' attribute is missing, guess at the language and
 * highlight.
 *
 * If the 'data-language' attribute is defined but not recognized, no
 * highlighting is performed.
 *
 */
HixIO.highlightSyntax = function() {
	$('pre code').each(function() {
		var e, lang;
		
		e = $(this);
		lang = e.attr('data-language');

		if(!lang) {
			hljs.highlightBlock(this);
		} else if(hljs.getLanguage(lang)) {
			e.html(hljs.highlight(lang, e.html(), true));
		}
	});
};

/*
 * Perform an asynchronous HTTP request and return the deferred result. See
 * can.ajax() and JQuery.ajax() for more information. I created this to help
 * keep the model definitions nice and clean and free of duplicated code.
 * 
 * Arguments:
 *
 *     path: (required)
 *         The relative path for the request.
 *
 *     method: (optional, default: 'GET')
 *         Your good 'ol supported HTTP verbs: GET, POST, PUT, DELETE, etc.
 *
 *     type: (optional, default: 'json')
 *         Content-Type for the request.
 */
HixIO.ajax = function(path, method, type) {
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

/*
 * Convenience method for notifications. HMmmm.
 */
HixIO.notify = function (message, message_class, timeout) {
	HixIO.message_bar.notify({
		message: message,
		message_class: message_class,
		timeout: timeout
	});
};

/******************************************************************************/
// Models
/******************************************************************************/

/*
 * I chose to keep the models as limited in functionality as possible. I use
 * custom methods for findAll because I'd like the dataset count for each model
 * returned along with the data for pagination.
 */

/*
 * Posts for a blog.
 */
HixIO.Post = can.Model.extend({
	list: HixIO.ajax('/api/v1/posts'),
	findOne: 'GET /api/v1/posts/{id}'
}, {});

/*
 * URLs for a URL-shortener.
 */
HixIO.URL = can.Model.extend({
	list: HixIO.ajax('/api/v1/urls'),
	shorten: HixIO.ajax('/api/v1/urls', 'POST')
}, {});

/*
 * Search across all models.
 */
HixIO.Search = can.Model.extend({
	list: HixIO.ajax('/api/v1/search')
}, {});

/******************************************************************************/
// Controls
/******************************************************************************/

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

		can.route('posts');
		can.route('post/:id');
	},

	update: function() {
		var self, params;
	   
		self = this;
		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			self.element.html(can.view('/static/templates/posts.ejs', {
				posts: HixIO.Post.models(data.posts)
			}));
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
			self.element.html(can.view('/static/templates/post.ejs', {
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
		var self;
	   
		self = this;

		this.q = null;
		this.pager = new HixIO.Pager(this.element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#search_pager'
		});

		can.route('search');
	},

	update: function() {
		var self, params;
	   
		self = this;
		params = this.pager.params({ q: this.q });

		HixIO.Search.list(params).success(function(data) {
			self.element.html(can.view('/static/templates/search.ejs', {
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
HixIO.CodeControl = can.Control.extend({
	defaults: {
		view: '/static/templates/code.ejs'
	}
}, {
	init: function(element, options) {
		can.route('code');
	},

	'code route': function(data) {
		this.element.html(can.view(this.options.view, {}));
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({}, {
	init: function(element, options) {
		can.route('urls');
	},

	update: function() {
		var self = this;
		
		HixIO.URL.list().success(function(data) {
			self.element.html(can.view('/static/templates/urls.ejs', {
				scheme: HixIO.meta.scheme,
				host: HixIO.meta.host,
				top_urls: HixIO.URL.models(data.top_urls),
				latest_urls: HixIO.URL.models(data.latest_urls),
				url: self.url
			}));
		}).error(function(data) {
			HixIO.notify("Woah! Where'd my URLs go?", 'error-message');
		});
	},

	'urls route': function(data) {
		this.update();
	},

	'#shorten keyup': function(element, event) {
		var self = this;

		if(event.keyCode === 13 && event.target.value !== '') {
			HixIO.URL.shorten({url: event.target.value}).success(function(data) {
				self.url = data;
				self.update();
			}).error(function(data) {
				HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
			});
		}
	}
});

/******************************************************************************/
// Re-usable Controls
/******************************************************************************/

/*
 * A pager.
 *
 * This control provides a widget for paging through many pages of objects and
 * integrates with the control used to render the current template.
 *
 * The basic lifecycle for the Pager control looks like this:
 *
 * - The control responsible for fetching and rendering instantiates a Pager,
 *   including a callback that handles refreshing the control's view when the
 *   Pager changes.
 *
 * - When the control is ready to fetch objects from the database, it calls
 *   params() on the pager to get the window parameters for the query.
 *
 * - When the request is complete and after the view has been rendered, the
 *   control calls update() on the Pager with the total number of objects to be
 *   paged through - which is not the same as the number of objects returned
 *   from the request.
 *
 * - When the pager's page is changed (eg. because it was clicked), the pager
 *   calls its callback to cause the control to refresh its data. It's expected
 *   that will cause the control to call update() on the Pager once more.
 *
 * Basically, it's a good idea to define a function (not a route) that updates
 * your view and calls update on the Pager. The practical upshot of doing it
 * this way is that you can use it as the Pager's callback /and/ call that
 * function from any number of routes.
 *
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     target: (required)
 *         The selector that yields one element to render the Pager into, and
 *         to listen for click events within.
 *
 *     on_change: (required)
 *         The function you want called when the Pager changes and the view and
 *         Pager need to be updated.
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
		view: '/static/templates/pager.ejs',
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

	'{target} a click': function(element, event) {
		var page = parseInt(element.attr('data-page'), 10);

		if(page >= 0 && page < this.state.pages) {
			this.state.attr('page', page);
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
 *     selected_class: (required)
 *         The class to add or remove based on whether the route is matches the
 *         link's path.
 *
 */
HixIO.Menu = can.Control.extend({},
{
	init: function(element, options) {
		var self = this;
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
HixIO.MessageBar = can.Control.extend({
	defaults: {
		timeout: 10.0,
		persist: false,
		view: '/static/templates/message.ejs',
		close: '.close-button'
	}
},{
	init: function(element, options) {
		var self = this;

		/*
		 * Close this control on route changes, unless the persist option is set.
		 */
		can.route.bind('route', function() {
			if(!self.options.persist) { self.close(); }
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
		var self, timeout, t;

		self = this;

		// Don't render the view if there's nothing to say.
		if(!this.message) { return; }

		// Don't update the view if it's visible.
		if(this.timeout || this.element.is(':visible')) { return; }

		timeout = parseInt(this.options.timeout, 10);
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
	'{close} click': function(element, event) { this.close(); }
});

/*
 * An application router.
 * 
 * This router provides a 'default route' by redirecting an empty route to the
 * configured default.
 * 
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     default_route: (optional)
 *         The hash string to redirect to if the route is empty.
 *
 *     main: (optional)
 *         The element to use when creating controls. The router should be
 *         created with document.body or a suitable top-level tag so that it
 *         can handle app-wide events.
 *
 */
HixIO.Router = can.Control.extend({
	defaults: {
		search: '#search'
	}
},{
	init: function(element, options) {
		can.route.ready();

		if(!can.route.attr('route') ||
		   can.route.attr('route') === '') {
			can.route.attr('route', this.options.default_route);
		}
	},

	/*
	 * Handle the search event globally.
	 */
	'{search} keyup': function(element, event) {
		if(event.keyCode === 13) {
			window.location.hash = can.route.url({route: 'search', q: event.target.value});
		}
	}
});

/******************************************************************************/
// Application entry point.
/******************************************************************************/

/*
 * Start up the main router.
 */
$(document).ready(function() {
	var main_element = '#main';

	HixIO.controls = [];
	HixIO.controls.push(
		new HixIO.SearchControl(main_element),
		new HixIO.PostControl(main_element),
		new HixIO.CodeControl(main_element),
		new HixIO.URLControl(main_element)
	);

	HixIO.message_bar = new HixIO.MessageBar('#messages');

	HixIO.menu = new HixIO.Menu('#menu', {
		selected_class: 'pure-menu-selected'
	});

	HixIO.router = new HixIO.Router(document.body, {
		default_route: 'posts',
	});
	
});

