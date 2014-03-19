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

can.route("posts/:id");

// Organizes a list of posts
var Posts = can.Control.extend({

	// called when a new posts() is created
	"init" : function( element, options ){

		// get all posts and render them with
		// a template in the element's html
		var el = this.element;
		Post.findAll({}, function(posts){
			el.html(can.view('/templates/posts.ejs', { posts: posts }))
			highlightSyntax();
		});
	}
});

// Routing puts all the widget controllers together
// along with managing routes
var Routing = can.Control.extend({

	init : function(){
		new Posts("#posts");
	}

});

// create routing controller
new Routing(document.body);

