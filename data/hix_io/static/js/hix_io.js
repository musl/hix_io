/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Namespace
 ******************************************************************************/

var HixIO = new can.Map({
	meta: {},
	template_path: '/static/templates/',
	template_suffix: '.stache',
	user: null
});

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
 * Render a view with a template's short name and the view helpers included.
 */
HixIO.view = function(name, obj) {
	var tmpl;

	tmpl = HixIO.attr('template_path') + name + HixIO.attr('template_suffix');
	return can.view(tmpl, obj, HixIO.view_helpers);
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
 * Helpers for views.
 */
HixIO.view_helpers = {
	current_user: function(block) {
		if(HixIO.attr('user')) { return block.fn(HixIO.attr('user')); }
		return false;
	},

	capitalize: function(string) {
		if(typeof string === 'function') { string = string(); }
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	expand_link: function(path, html) {
		var url;

		console.log('expand_link(' + path + ', ' + html + ');');

		url = HixIO.attr('meta').scheme + '://' + HixIO.attr('meta').host + '/' + path;
		if(typeof html !== 'string' ) { html = url; }

		return $('<a></a>').attr('href', url).html(html);
	},

	short_date: function(date_arg) {
		if(typeof date_arg === 'function') { date_arg = date_arg(); }
		return (new Date(date_arg)).toISOString();
	},

	relative_date: function(date_arg) {
		if(typeof date_arg === 'function') { date_arg = date_arg(); }
		return moment(new Date(date_arg)).fromNow();
	},

	validation_error: function(property) {
		var errors;

		errors = this.errors.attr(property);
		if(errors) {
			// TODO: Turn this into a block helper.
			return $('<span></span>').addClass("validation-error arrow_box").html(errors.join(' '));
		}
		return false;	
	},

	datatable: function(data, columns) {
		var cols, self, table, wrapper;
		
		self = this;	
		table = $('<table></table>');
		table.wrap('<div></div>');
		wrapper = table.parent();

		cols = $.map(columns.split(/\s+/), function(col) {
			return {
				data: col,
				title: col
			};
		});

		// TODO: Use the hash form for columns, and accept options.
		wrapper.addClass('pure-form');
		table.addClass('stripe');

		table.dataTable({
			data: data,
			columns: cols
		});

		return wrapper;
	}
};

/*
 * Generate a SHA512 hex digest.
 */
HixIO.sha512 = function(message) {
	var SHA, sha;

	SHA = jsSHA;
	sha = new SHA(message, "TEXT");

	return sha.getHash('SHA-512', 'HEX');
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
	findOne: 'GET /api/v1/posts/{id}',
	update: 'PUT /api/v1/posts/{id}',
	destroy: 'DELETE /api/v1/posts/{id}'
}, {});

/*
 * URLs for a URL-shortener.
 */
HixIO.URL = can.Model.extend({
	summary: HixIO.ajax('/api/v1/urls/summary'),
	shorten: HixIO.ajax('/api/v1/urls', 'POST')
}, {});

/*
 * User Accounts.
 */
HixIO.User = can.Model.extend({
	init: function() {
		this.validateLengthOf('email', 3, 255, {message: 'Please enter your address.'});
		this.validatePresenceOf('name', {message: 'Please enter your name.'});
		this.validatePresenceOf('password', {message: 'Please enter a password.'});
		this.validate('verify_password', function(value) {
			if(value !== this.attr('password')) {
				return 'Those passwords do not match.';
			}
		});
	},

	update: 'PUT /api/v1/users/{id}'

}, {});

/*
 * Metadata Catch-all.
 */
HixIO.Meta = can.Model.extend({
	dash: HixIO.ajax('/api/v1/dash')
}, {});

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
		view: 'pager',
	}
},{
	init: function(element, options) {
		var p;

		this.state = new can.Map({
			count: 0,
			per_page: 10,
			pages: 0, 
			page: 1,
			pad: 2
		});

		this.state.bind('page', options.on_change);

		p = parseInt(options.per_page, 10);
		if(p > 0) { this.options.per_page = p; }

		p = parseInt(options.pad, 10);
		if(p > 0) { this.options.pad = p; }
	},

	update: function(count) {
		var a, c, i, p, ds, de, data;

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
		ds = Math.max(1, p - a + Math.min(1, c - (p + a) - 1));
		de = Math.min(c, p + a + Math.max(1, -1 * (p - a)) + 1);

		data = {
			first: 1,
			prev:  p > 1 ? p - 1 : null,
			left:  [],
			page:  p,
			count: c,
			right: [],
			next:  p < c ? p + 1 : null,
			last:  c,
		};

		for(i = ds; i < p; i += 1 ){ data.left.push(i); }
		for(i = p + 1; i <= de; i += 1 ){ data.right.push(i); }

		$(this.options.target).html(HixIO.view(this.options.view, data));

	},

	params: function(params) {
		if(!params) { params = {}; }
		params.page = this.state.attr('page') - 1;
		params.offset = (this.state.attr('page') - 1) * this.state.attr('per_page');
		params.limit = this.state.attr('per_page');
		return params;
	},

	'{target} a click': function(element, event) {
		var page = parseInt(element.attr('data-page'), 10);

		if(page > 0 && page <= this.state.attr('pages')) {
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
HixIO.Menu = can.Control.extend({
	defaults: {
		view: 'menu',
		selected_class: 'selected'
	}
},{
	init: function(element, options) {
		var self = this;

		this.update();

		HixIO.bind('user', function() { self.update(); });
		can.route.bind('route', function() { self.highlight(); });
	},

	update: function() {
		this.element.html(HixIO.view(this.options.view, {}));
	},

	highlight: function() {
		var self = this;

		$('.pure-menu li a').each(function(i,e) {
			var route, regex;

			if(!can.route.attr('route')) { return; }

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
		timeout: 6,
		persist: true,
		view: 'message',
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
						self.element.html(HixIO.view(self.options.view, self.data));
						self.element.fadeIn('fast');
					});
				} else {
					self.element.html(HixIO.view(self.options.view, self.data));
					self.element.fadeIn('slow');
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

		HixIO.delegate('notify', this);
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

		this.element.fadeOut('slow', function() {
			self.element.empty();
			self.data.attr({
				message: null,
				timeout: null,
				message_class: null
			});
		});
	},

	// Hook up the close event.
	'click': function(element, event) { this.close(); }
});

