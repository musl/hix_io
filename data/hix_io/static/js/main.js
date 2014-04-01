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
 * Perform an asynchronous HTTP request and return the deferred result.
 */
function asyncReq(path, method, type) {
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
var Post = can.Model.extend({
	findOne: 'GET /api/v1/posts/{id}',
	list:    asyncReq('/api/v1/posts'),
	search:  asyncReq('/api/v1/posts/search'),
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
var Pager = can.Control.extend({
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

		// The reason we need this is that the element won't exist when this control
		// is created.
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
var PostControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.pager = new Pager(element, {
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

		Post.list(params).done(function(data) {
			self.element.html(can.view('/templates/posts.ejs', {
				posts: Post.models(data.posts),
			}));
			self.pager.update(data.count);
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
 * Provide a control for displaying search results.
 */
var SearchControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.q = null;
		this.pager = new Pager(element, {
			per_page: 5,
			on_change: function() { self.update(); },
			target: '#search_pager',
		});

		can.route('search');
	},

	update: function() {
		var self = this;

		params = this.pager.params({ q: this.q });

		Post.search(params).done(function(data) {
			self.element.html(can.view('/templates/search.ejs', {
				posts: Post.models(data.posts),
				q: self.q,
			}));
			self.pager.update(data.count);
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

