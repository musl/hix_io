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
	$('pre code').each(function( i, e ) {
		var el = $(e);
		var lang = el.attr('data-language');

		if( typeof lang == 'undefined' ) {
			hljs.highlightBlock(e);
		} else if( typeof hljs.getLanguage( lang ) != 'undefined' ) {
			el.html(hljs.highlight(lang, el.html(), true));
		}
	});
}

var Post = can.Model.extend({
	findAll: 'GET /api/v1/posts',
	findOne: 'GET /api/v1/posts/{id}'
}, {});

var Router = can.Control({

	defaults: {} 

}, {

	"init" : function( element, options ){
		// Any load-once stuff should be loaded here.

		// Setup route templates.
		can.route("posts/:id");

		// We're the routing authority.
		can.route.ready();
	},

	'route' : function() {
		Post.findAll({}, function(posts) {
			$('#main').html(can.view('/templates/posts.ejs', { posts: posts }));
			highlightSyntax();
		});
	},

	'posts/:id route' : function(data) {
		Post.findOne({ id: data.id }, function(post) {
			$('#main').html(can.view('/templates/post.ejs', { post: post }));
			highlightSyntax();
		});
	}

});

$(window).ready( function() { new Router(); });

