/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Namespace
 ******************************************************************************/

var HixIO = new can.Map({});

/******************************************************************************
 * Utility Functions
 ******************************************************************************/

/*
 * Delegate a method on our namespace to another object.
 * 
 * Arguments:
 *     name: (required)
 *         The name of the function to create on this namespace.
 *
 *     object: (required)
 *         The object to delegate the function to.
 *
 */
HixIO.delegate = function(name, object) {
	HixIO[name] = function() {
		object[name].apply(object, arguments);
	};
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
 * Helpers for views. Pass this to can.view.
 */
HixIO.view_helpers = {

	capitalize: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	short_date: function(date_arg) {
		return (new Date(date_arg)).toISOString();
	},

	relative_date: function(date_arg) {
		var minute,
			hour,
			day,
			now,
			date,
			delta,
			last_night,
			the_other_night,
			ago;

		minute = 60000;
		hour = 60 * minute;
		day = 24 * hour;

		date = new Date(date_arg).getTime();
		if(date <= 0 || isNaN(date)) { return date_arg; }

		now = new Date().getTime();
		delta = now - date;

		if(delta < 0) { return date_arg; }

		if(delta === 0) { return 'now'; }

		if(delta < 2 * minute) { return 'seconds'; }

		if(delta < 2 * hour) {
			ago = Math.ceil(delta / minute);
			return ago + ' minutes';
		}

		if(delta < 2 * day) {
			ago = Math.ceil(delta / hour);
			return ago + ' hours';
		}

		last_night = new Date(now - now % day).getTime();
		if(date > last_night) { return 'today'; }

		the_other_night = last_night - day;
		if(date > the_other_night) { return 'yesterday'; }

		ago = Math.ceil(delta / day);
		return ago + ' days';
	}
};

/******************************************************************************
 * Auth
 ******************************************************************************/

HixIO.authorized = function() {
	return HixIO.attr('current_user') !== null;
};

HixIO.on_auth_change = function(callback) {
	HixIO.bind('current_user', callback);
};

HixIO.check_auth = function(callback) {
	if(!HixIO.attr('current_user')) {
		HixIO.ajax('/auth', 'GET')().success(function(data) {
			HixIO.attr('current_user', data); 
			if(callback) { callback(); }
		}).error(function(data) {
			if(data.status >= 400 && data.status < 500) {
				HixIO.attr('current_user', null);
			}
			if(callback) { callback(); }
		});
	}
};

HixIO.log_in = function(params) {
	HixIO.ajax('/auth', 'POST')(params).success(function(data) {
		HixIO.attr('current_user', data);
		HixIO.notify('You have signed in.', 'success-message');
	}).error(function(data) {
		if(data.status === 401) {
			HixIO.notify('Invalid email or password.', 'warning-message');
		} else {
			HixIO.notify('Woah, there was a problem signing you in.', 'error-message');
		}
	});
};

HixIO.log_out = function() {
	HixIO.ajax('/auth', 'DELETE')().success(function(data) {
		HixIO.attr('current_user', null);
		HixIO.notify('You have signed out.', 'success-message');
	}).error(function(data) {
		HixIO.notify('Woah. There was a problem signing out.', 'error-message');
	});
};

/******************************************************************************
 * Models
 ******************************************************************************/

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
 * User accounts.
 */
HixIO.User = can.Model.extend({}, {});

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

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
	},

	update: function() {
		var self, params;
	   
		self = this;
		params = this.pager.params();

		HixIO.Post.list(params).success(function(data) {
			self.element.html(can.view('/static/templates/posts.ejs', {
				posts: HixIO.Post.models(data.posts)
			},
			HixIO.view_helpers));
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
			},
			HixIO.view_helpers));
			HixIO.highlightSyntax();
		});
	}
});

/*
 * A control for a shared photo timeline.
 */
HixIO.PicsControl = can.Control.extend({
	defaults: {
		view: '/static/templates/pics.ejs'
	}
}, {
	'pics route': function(data) {
		this.element.html(can.view(this.options.view, {}));
	}
});

/*
 * A control for a shared photo timeline.
 */
HixIO.ProfileControl = can.Control.extend({
	defaults: {
		view: '/static/templates/profile.ejs'
	}
}, {
	init: function(element, options) {
		var self;

		self = this;

		HixIO.on_auth_change(function() {
			if(can.route.attr('route') === 'profile') { self.update(); }
		});
	},

	update: function() {
		this.element.html(can.view(this.options.view, {
			user: HixIO.attr('current_user')
		}));
	},

	'profile route': function(data) {
		this.update();
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({}, {
	init: function(element, options) {
		var self;

		self = this;

		HixIO.on_auth_change(function() {
			if(can.route.attr('route') === 'urls') { self.update(); }
		});
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
			},
			HixIO.view_helpers));
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
				if(data.status === 403) {
					HixIO.notify('You aren\'t allowed to shorten urls.', 'error-message');
				} else if(data.status === 401) {
					HixIO.notify('You need to log in to shorten URLs.', 'info-message');
				} else {
					HixIO.notify('I wasn\'t able to shorten that.', 'warning-message');
				}
			});
		}
	}
});

/******************************************************************************
 * Re-usable Controls
 ******************************************************************************/

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
		this.state.attr('pages',
			Math.ceil(this.state.attr('count') / this.state.attr('per_page')
		));

		if(this.state.attr('count') < this.state.attr('per_page')) { return; }

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
		params.offset = this.state.attr('page') * this.state.attr('per_page');
		params.limit = this.state.attr('per_page');
		return params;
	},

	'{target} a click': function(element, event) {
		var page = parseInt(element.attr('data-page'), 10);

		if(page >= 0 && page < this.state.attr('pages')) {
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
			var route, regex;

			route = can.route.attr('route').split('/')[0];
			regex = new RegExp(route + '(\/|$)');

			if(e.href.match(regex)){
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
 *     default_class: (optional)
 *         The class name to use if one isn't given to the notify() function.
 *
 * Ideas:
 *     - per-message persist option
 *     - options to disable or change FX
 *
 */
HixIO.MessageBar = can.Control.extend({
	defaults: {
		timeout: 10,
		persist: false,
		view: '/static/templates/message.ejs',
		close: '.close-button',
		default_class: 'info-message'
	}
},{
	init: function(element, options) {
		var self;

		self = this;

		this.data = new can.Map({
			message: '',
			message_class: '',
			timeout: this.options.timeout
		});

		/*
		 * Bind to message changes to update the view.
		 */
		this.data.bind('message', function(event, new_value, old_value) {

			/*
			 * Only notify if the message is not null, not empty, and isn't the message
			 * that's currently displayed.
			 */
			if(new_value && new_value !== '' && new_value !== old_value) {

				/*
				 * Fade if we're interrupting, slide down if we're displaying 
				 * a message when there isn't one currently visible.
				 */
				if(self.element.is(':visible')) {
					clearTimeout(self.timeout);
					self.timeout = null;
					self.element.fadeOut('fast', function() {
						self.element.html(can.view(self.options.view, self.data));
						self.element.fadeIn('fast');
					});
				} else {
					self.element.html(can.view(self.options.view, self.data));
					self.element.slideDown('fast');	
				}

				/*
				 * Close this control after the given timeout.
				 */
				self.timeout = setTimeout(function() {
					self.close();
				}, self.data.attr('timeout'));
			}
		});

		/*
		 * Close this control on route changes, unless the persist option is set.
		 */
		can.route.bind('route', function() {
			if(!self.options.persist) { self.close(); }
		});
	},

	/*
	 * This is the canonical function to use when we need to display a
	 * notification.
	 */
	notify: function(message, message_class, timeout) {

		/*
		 * Validate & apply defaults before displaying a message.
		 */
		if(!message_class) { message_class = this.options.default_class; }
		if(!timeout) { timeout = this.options.timeout; }
		timeout = Math.floor(timeout * 1000);

		this.data.attr({
			message: message,
		   	timeout: timeout,
			message_class: message_class
		});
	},

	/*
	 * Hide and reset this control.
	 */
	close: function() {
		var self = this;

		this.element.clearQueue();
		clearTimeout(this.timeout);
		this.timeout = null;

		this.element.slideUp('slow', function() {
			self.element.empty();
			self.data.attr({
				message: null,
				timeout: null,
				message_class: null
			});
		});
	},

	// Hook up the close event.
	'{close} click': function(element, event) { this.close(); }
});

/*
 * An auth control.
 */
HixIO.LoginForm = can.Control.extend({
	defaults: {
		view: '/static/templates/login_form.ejs',
		log_out_button: '#log-out-button',
		log_in_email: '#log-in-email',
		log_in_password: '#log-in-password',
		hash_algorithm: 'SHA-512'
	}
},{
	init: function(element, options) {
		var self;

		self = this;

		HixIO.on_auth_change(function() { self.update(); });
		this.element.hide();
	},

	update: function() {
		var self,render;
	
		self = this;
		render = function() {
			self.element.html(can.view(self.options.view, {
				user: HixIO.attr('current_user')
			}));
			self.element.fadeIn('fast');
		};

		if(this.element.is(':visible')) {
			this.element.fadeOut('fast', function() {
				render();
			});
			return;
		}

		render();
	},

	'{log_out_button} click': function(element, event) {
		HixIO.log_out();	
	},

	'{log_in_password} keyup': function(element, event) {
		var creds, email_field, password_field, sha, SHA;

		if(event.keyCode === 13) {
			email_field = $(this.options.log_in_email);
			password_field = $(this.options.log_in_password);

			if(email_field.val() === '' || password_field.val() === '') { return; } 

			SHA = jsSHA;
			sha = new SHA( password_field.val(), "TEXT" );
			creds = {email: email_field.val(), password: sha.getHash(this.options.hash_algorithm, "HEX")};

			HixIO.log_in(creds);
		}
	}
});

/*
 * Provide routes for the main content.
 *
 * Options for creating this control:
 * (See the code for the defaults.)
 *
 *     routes: (required)
 *         An object that maps route names to controls.
 *
 *     default_route: (required)
 *         The route to use if no hash is present in the current location.
 *     
 */
HixIO.Router = can.Control.extend({},{

	init: function(element, options) {
		var self;

		self = this;

		// Add auth requirement support to routes?
		HixIO.check_auth(function() {
			self.route();
		});
	},

	route: function() {
		var self;

		self = this;
		this.controls = {};

		can.each(this.options.routes, function(control, route) {
			self.controls[route] = control.newInstance(self.element);
		});

		can.route.ready();

		if(!can.route.attr('route') || can.route.attr('route') === '') {
			this.default_route();
		}
	},

});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {

	HixIO.message_bar = new HixIO.MessageBar('#messages');
	HixIO.delegate('notify', HixIO.message_bar);

	HixIO.menu = new HixIO.Menu('#menu', {
		selected_class: 'pure-menu-selected'
	});

	HixIO.login_form = new HixIO.LoginForm('#login-form');

	HixIO.router = new HixIO.Router('#main', {
		routes: {
			pics: HixIO.PicsControl,
			posts: HixIO.PostControl,
			profile: HixIO.ProfileControl,
			urls: HixIO.URLControl
		},
		default_route: 'posts'
	});

});

