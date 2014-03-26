// vim: set nosta noet ts=4 sw=4 ft=javascript:

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
 * Perform a synchronous HTTP request and return the body as a json string.
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

var Post = can.Model.extend({
	findAll: 'GET /api/v1/posts',
	findOne: 'GET /api/v1/posts/{id}',
	count:   syncReq('GET', '/api/v1/posts/count'),
	search:  asyncReq('GET', '/api/v1/posts/search')
}, {});

var PostControl = can.Control.extend({}, {
	init: function(element, options) {
		var self = this;

		this.pager = new Pager(element, {
			model: Post,
			per_page: 15, 
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

var Pager = can.Control.extend({
	defaults: {
		view: '/templates/pager.ejs',
		target: '#pager',
	}
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
		});

		this.state.bind('change', function() { self.update(); });
		this.state.bind('change', options.on_change);

		if(options.target) {
			this.options.target = options.target;
		}
	},

	update: function() {
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

		if(page >= 0 && page < pages) {
			this.state.attr('page', page);
		}
	}
});

$(document).ready(function() {
	
	// TODO write a general router that picks the proper control based on route.

	var el = '#main';

	var post_list = new PostControl(el);
	var search_results = new SearchControl(el);

	$('#search').keyup(function(e) {
		if(e.keyCode == 13) {
			window.location.hash = can.route.url({route: 'search', q: e.target.value});
		}
	});

	can.route.ready();

});

