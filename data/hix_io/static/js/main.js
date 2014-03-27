// vim: set nosta noet ts=4 sw=4 ft=javascript:

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
function highlightSyntax() {
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
 * Perform a synchronous HTTP request and return the body.
 */
function syncReq(type, path) {
	return function(params) {
		var result = null;

		$.ajax({
			url: path,
			type: 'get',
			data: params,
			dataType: 'json',
			async: false,
			success: function(data) {
				result = data;
			}
		});

		return result;
	};
}

/*
 * Perform an asynchronous HTTP request and return the deferred result.
 */
function asyncReq(type, path) {
	return function(params) {
		return can.ajax({
			url: '/api/v1/posts/search',
			type: 'get',
			data: params,
			dataType: 'json'
		});
	};
}

/******************************************************************************/
// Models
/******************************************************************************/

/*
 * Posts for a blog.
 */
var Post = can.Model.extend({
	findAll: 'GET /api/v1/posts',
	findOne: 'GET /api/v1/posts/{id}',
	count:   syncReq('GET', '/api/v1/posts/count'),
	search:  asyncReq('GET', '/api/v1/posts/search')
}, {});

/******************************************************************************/
// Controls
/******************************************************************************/

/*
 * A reusable pager control.
 *
 * Provides pagination with any model with the following requirements:
 *
 * - The given model provides a function count() which is the total number of
 *   items that are available.
 *
 * - You provide a function that gets called when the pager is changed. The
 *   callback must call update() on the pager in return so that the pager gets
 *   re-rendered. This means that your view is in control - you can put the
 *   pager's element inside another template if you wish.
 *
 * - The model supports limit and offset parameters to findAll(). If so, it's
 *   as easy as passing the object returned from query_params() to your
 *   findAll(). You'll likely be building a custom set of parameters anyway, so
 *   you'll probably want to use query_params() as a starting point and tack on
 *   your other parameters.
 *
 * If you'd like to store the current page in a javascript cookie, make sure
 * to set the 'cookie' option when creating the pager. You'll also need the
 * jquery-cookie plugin, or a function called $.cookie() that works the same
 * way. 
 *
 * Basic usage:
 *
 * The basic idea is that this control will be used by other controls and it's
 * target element in the dom will be contained in or rendered by another
 * template.
 *
 * In your control's init funciton, create a new Pager, passing in the element
 * that your view is bound to or the one that contains the target element for
 * the pager, and the options you'd like. Be sure to include the callback
 * 'on_change' that re-renders your view. In that function, make sure to use
 * query_params() to get the current offset and limit to pass to findAll().
 *
 * Also, make sure to call update() on the pager in that function. For example:
 *
 *    init: function(element, options) {
 *        var self = this;
 *        
 *        this.pager = new Pager(element, {
 *            model: MyModel,
 *            per_page: 5, 
 *            on_change: function() { self.update(); },
 *        });
 *    },
 *    
 *    update: function() {
 *        var self = this;
 *        
 *        MyModel.findAll(this.pager.query_params(), function(items) {
 *            self.element.html(can.view('my_template.ejs', { items: items }));
 *            self.pager.update();
 *        });
 *    },
 *
 * In your template (my_template.ejs above), make sure to include the element
 * that your pager renders to. It's '#pager' by default.
 * 
 * Options you can pass to new Pager(element, options) are:
 *
 *     on_change: (required)
 *         The function to call when the pager is clicked and it
 *         results in a page change.
 *
 *     model: (required)
 *         The model that this pager is paging through.
 *
 *     per_page: (optional, default: 10)
 *         The number of items per page.
 *
 *     pad: (optional, default: 2)
 *         The number of numbers to show on each side of the curent page in the
 *         pager.
 *
 *     target: (optional, default: '#pager')
 *         The selector that yields one element to render the pager into.
 *
 *     cookie: (optional, default: null)
 *         The name of the javascript cookie that's set to retain the current
 *         page number. Set this to a simple string to enable the cookie.
 *
 */
var Pager = can.Control.extend({
	defaults: {
		view: '/templates/pager.ejs',
		target: '#pager',
		model: null,
		cookie: null,
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

		this.options.model = options.model;
		this.options.cookie = options.cookie;
		if(options.target) { this.options.target = options.target; }

		p = parseInt(options.per_page);
		if(p > 0) { this.options.per_page = p; }

		p = parseInt(options.pad);
		if(p > 0) { this.options.pad = p; }
	},

	update: function() {
		p = this.state.page;
		c = this.state.pages;
		a = this.state.pad;

		// Find the ammount we need to extend each side of the window to account for
		// collapses on the opposite side. This allows for a roughly constant-width
		// control.
		//
		ds = Math.min(0, c - (p + a) - 1);	
		de = Math.max(0, -1 * (p - a)) + 1;

		// Calculate and store the indexes for the window.
		//
		this.state.attr('window_start', Math.max(0, p - a + ds));
		this.state.attr('window_end', Math.min(c, p + a + de));

		$(this.options.target).html(can.view(this.options.view, this.state));
	},

	query_params: function() {
		// Attempt to update the count if we have something that doesn't make sense
		// as a count.
		//
		if(this.state.count <= 0) {
			this.state.attr('count', parseInt(this.options.model.count()));
			this.state.attr('pages', Math.ceil(this.state.count / this.state.per_page));
		}

		// If enabled, use a JavaScript cookie to restore the last page viewed.
		//
		if(this.options.cookie) {
			stored_page = parseInt($.cookie(this.options.cookie));

			if(stored_page >= 0 &&
			   stored_page < this.state.pages &&
			   stored_page != this.state.page ) {

				// Suppress the change event so the view isn't rendered multiple times.
				//
				this.state.unbind('page', this.options.on_change);
				this.state.attr('page', stored_page);
				this.state.bind('page', this.options.on_change);
			} else {
				$.cookie(this.options.cookie, this.state.page);
			}
		}

		return {
			offset: this.state.page * this.state.per_page,
			limit: this.state.per_page,
		};
	},

	'{target} a click': function(el, ev) {
		var page = parseInt(el.attr('data-page'));

		if(page >= 0 && page < this.state.pages) {
			$.cookie(this.options.cookie, page);
			this.state.attr('page', page);
		}

	},
});

/*
 * Provide a list of posts or details on a single post.
 */
var PostControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.pager = new Pager(element, {
			model: Post,
			per_page: 5, 
			on_change: function() { self.update(); },
			cookie: 'hix_io_pager_page',
		});

		can.route('posts');
		can.route('post/:id');
	},

	update: function() {
		var self = this;

		Post.findAll(this.pager.query_params(), function(posts) {
			self.element.html(can.view('/templates/posts.ejs', {
				posts: posts
			}));
			self.pager.update();
			highlightSyntax();
		});
	},

	'posts route': function() {
		this.update();
	},

	'posts/:id route': function(data) {
		var self = this;

		Post.findOne({ id: data.id }, function(post) {
			self.element.html(can.view('/templates/post.ejs', {
				post: post
			}));
			highlightSyntax();
		});
	},
});

/*
 * A control for listing and displaying projects.
 */
var CodeControl = can.Control.extend({}, {
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
var URLControl = can.Control.extend({}, {
	init: function() {
		can.route('urls');
	},

	'urls route': function() {
		this.element.html('urls');
	},
});

/*
 * A control to update the menu based on the hash.
 */
var MenuControl = can.Control.extend({
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
 * Provide a control for displaying search results.
 */
var SearchControl = can.Control.extend({}, {
	init: function(element, options) {
		can.route('search');
	},

	'search route': function(data) {
		var self = this;

		Post.search({q: data.q}).done( function(data) {
			self.element.html(can.view('/templates/search.ejs', {
				posts: Post.models(data)
			}));
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
var Router = can.Control.extend({
	defaults: {
		main: '#main',
		menu: '#menu',
		default_route: 'posts',
	},
}, {
	init: function(element, options) {
		// Handle options.
		//
		if(options.main) { this.options.main = options.main; }
		if(options.menu) { this.options.menu = options.menu; }
		if(options.default_route) { this.options.default_route = options.default_route; }

		// Instantiate all of the controls. This assumes that nobody's doing anything
		// stupid inside of init methods, like making http calls, writing to the main
		// element, etc.
		//
		new MenuControl(this.options.menu);
		new SearchControl(this.options.main);
		new PostControl(this.options.main);
		new CodeControl(this.options.main);
		new URLControl(this.options.main);

		// All routes get defined in each control's init method, all of the routes we
		// need should be ready by now.
		can.route.ready();

		// Direct the browser to the default route.
		//
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
	new Router(document.body);
});

