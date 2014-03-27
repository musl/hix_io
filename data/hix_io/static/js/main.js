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
 *     on_change:
 *         The function to call when the pager is clicked and it
 *         results in a page change.
 *
 *     model:
 *         The model that this pager is paging through.
 *
 *     per_page:
 *         The number of items per page.
 *
 *     pad:
 *         The number of numbers to show on each side of the curent page in the
 *         pager. The default is 2.
 *
 *     target:
 *         The selector that yields one element to render the pager into.
 *         Defaults to '#pager'.
 *
 */
var Pager = can.Control.extend({

	defaults: {
		view: '/templates/pager.ejs',
		target: '#pager',
	},

},{

	init: function(element, options) {
		var self = this;
		var count = parseInt(options.model.count());
		var per_page = parseInt(options.per_page);

		this.state = new can.Map({
			count: count,
			per_page: per_page,
			pages: Math.ceil(count / per_page),
			page: 0,
			pad: 2,
		});

		this.state.bind('change', options.on_change);

		if(options.target) {
			this.options.target = options.target;
		}
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
		this.state.window_start = Math.max(0, p - a + ds);
		this.state.window_end   = Math.min(c, p + a + de);

		$(this.options.target).html(can.view(this.options.view, this.state));
	},

	query_params: function() {
		return {
			offset: this.state.page * this.state.per_page,
			limit: this.state.per_page,
		};
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
			model: Post,
			per_page: 5, 
			on_change: function() { self.update(); },
		});

		can.route('post/:id');
	},

	update: function() {
		var self = this;

		Post.findAll(this.pager.query_params(), function(posts) {
			self.element.html(can.view('/templates/posts.ejs', { posts: posts }));
			self.pager.update();
			highlightSyntax();
		});
	},

	route: function() {
		this.update();
	},

	'post/:id route': function(data) {
		var self = this;

		Post.findOne({ id: data.id }, function(post) {
			self.element.html(can.view('/templates/post.ejs', { post: post }));
			highlightSyntax();
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
			self.element.html(can.view('/templates/search.ejs', { posts: Post.models(data) }));
		});
	},

});

/*
 * Setup the initial environment, route requests to controllers, and handle
 * events for the whole document.
 */
var Router = can.Control.extend({

	defaults: {
		main: '#main',
		menu: '#menu',
	},

}, {

	init: function(element, options) {

		// Extract the route name from the hash.	
		//
		var route = window.location.hash.match( /#!(\w+)/ );
		if(route) { route = route.pop(); }

		// Handle options.
		//
		if(options.main) { this.options.menu = options.main; }
		if(options.menu) { this.options.menu = options.menu; }

		console.log("Route: " + route);

		// TODO create a navigation control.
		//new MenuControl(this.options.menu);

		// Searches may be performed from any page, so the route needs to be present.
		new SearchControl(this.options.main);

		// Pick the control(s) that match the route.
		//
		switch(route) {
			case 'code':
				// TODO create a code controller
				//new CodeControl(this.options.main);
				break;
			case 'url':
				// TODO create a url controller
				//new URLControl(this.options.main);
				break;
			case 'post':
			default:
				new PostControl(this.options.main);
				break;
		}
 
		can.route.ready();
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
// A standard jQuery entry point.
/******************************************************************************/

$(document).ready(function() {
	new Router(document.body);
});

