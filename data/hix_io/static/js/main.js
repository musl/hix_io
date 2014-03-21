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

		if(typeof lang == 'undefined') {
			hljs.highlightBlock(e);
		} else if(typeof hljs.getLanguage(lang) != 'undefined') {
			el.html(hljs.highlight(lang, el.html(), true));
		}
	});
}

function syncReq(type, path) {
	return function(params) {
		var result = null;

		$.ajax({
			url: path,
			type: 'get',
			dataType: 'json',
			async: false,
			success: function(data) {
				result = data;
			}
		});

		return result;	
	};
}

var Post = can.Model.extend({
	findAll: 'GET /api/v1/posts',
	findOne: 'GET /api/v1/posts/{id}',
	count:   syncReq('GET', '/api/v1/posts/count')
}, {});

var Pager = can.Control({
	defaults: {
		view: '/templates/pager.ejs',
		target: '#pager',
		per_page: 5,
		count: 0,
		pages: 0,
		page: 0
	}
}, {
	'init' : function(element, options) {
		this.options.count = options.model.count();
		this.options.pages = Math.ceil(this.options.count / this.options.per_page);

		$(options.target).html(can.view(this.options.view, this.options));
	}
});

var Router = can.Control({
	defaults: {
		target: '#main',
		posts_per_page: 2,
		post_count: 0,
		pages: 0,
	} 
}, {
	'init' : function(element, options) {
		// Any load-once stuff should be loaded here.
		this.options.post_count = Post.count();
		this.options.pages = Math.ceil(this.options.post_count / this.options.posts_per_page);

		// Setup route templates.
		can.route(':page');
		can.route('posts/:id');

		// We're the routing authority.
		can.route.ready();
	},

	'route' : function() {
		var target = $(this.options.target);
		var params = { offset: 0, limit: this.options.posts_per_page };
		var opts = { page: 0, pages: this.options.pages };
	
		console.log( params );

		Post.findAll( params,
			function(posts) {
				target.html(can.view('/templates/posts.ejs', { posts: posts, opts: opts }));
				highlightSyntax();
			}
		);
	},

	':page route' : function(data) {
		var target = $(this.options.target);
		var params = {
			offset: parseInt(data.page) * this.options.posts_per_page,
			limit: this.options.posts_per_page
		};
		var opts = {
			page: parseInt(data.page),
			pages: this.options.pages
		};

		console.log( params );

		Post.findAll( params,
			function(posts) {
				target.html(can.view('/templates/posts.ejs', { posts: posts, opts: opts }));
				highlightSyntax();
			}
		);
	},

	'posts/:id route' : function(data) {
		var target = $(this.options.target)

		Post.findOne({ id: data.id }, function(post) {
			target.html(can.view('/templates/post.ejs', { post: post }));
			highlightSyntax();
		});
	},

});

$(document).ready(function() { new Router(document.body); });

