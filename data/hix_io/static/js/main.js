// vim: set nosta noet ts=4 sw=4 ft=javascript:

var Post = can.Model.extend({
	findAll: 'GET /api/v1/posts',
	findOne: 'GET /api/v1/posts/{id}'
}, {});

can.route("posts/:id");

// Organizes a list of posts
var Posts = can.Control.extend({

  // called when a new posts() is created
  "init" : function( element , options ){
    
    // get all posts and render them with
    // a template in the element's html
    var el = this.element;
    Post.findAll({}, function(posts){
        el.html( can.view('/templates/posts.ejs', {posts: posts}) )
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

