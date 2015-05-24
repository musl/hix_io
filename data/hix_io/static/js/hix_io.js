/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Namespace
 ******************************************************************************/

 var HixIO = new can.Map({
 	meta: {},
 	template_path: '/static/templates/',
 	template_suffix: '.stache',
 	user: false,
 	message: ''
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
 * Prep everything we need, and then call can.route.ready();
 */
 HixIO.boot = function() {
 	var session;

 	if(session = $.cookie('hix_io_session')) {
		// If there's a session, wait until it's determined if the user is
		// logged in before rendering the app.
		HixIO.User.current().success(function(data) {
			HixIO.attr('user', HixIO.User.model(data));
			can.route.ready();
		}).error(function(data) {
			can.route.ready();
		});
		return;
	}

	// If there's no session, just boot.
	can.route.ready();
};

/*
 * Display a message to the user or just log it to the console based
 * on the given level.
 */
 HixIO.log = function(message, level) {
 	switch(level) {
 		case "error":
 		case "warn":
 		case "info":
 		case "success":
 		HixIO.attr('message', {'message': message, 'level': level});
 		if(HixIO.meta.dev) { console.log(level + ": " + message); }
 		break;
 		default:
 		console.log(message);
 		break;
 	}
 };

/*
 * Authenticate the current session.
 */
 HixIO.login = function(email, password) {
 	if(email == "" || password == "") { return; }
 	HixIO.ajax('/auth/', 'POST')({
 		"email": email,
 		"password": password
 	}).success(function(data) {
 		HixIO.attr('user', HixIO.User.model(data));
 		HixIO.log("Logged in.", "success");
 	}).error(function(data) {
 		HixIO.log(data.status + ": Could not log in.", "warn");
 	});
 };

/*
 * Destroy the current session.
 */
 HixIO.logout = function() {
 	HixIO.ajax('/auth/', 'DELETE')().success(function(data) {
 		$.removeCookie(HixIO.session_cookie_name);
 		HixIO.attr('user', false);
 		HixIO.log("Logged out.", "success");
 	}).error(function(data) {
 		HixIO.log(data.status + ": Could not log out.", "warn");
 	});
 };

/*
 * Helpers for views.
 */
 HixIO.view_helpers = {
 	current_user: function(block) {
 		if(HixIO.attr('user')) {
			//return block.fn(HixIO.attr('user'));
			return true;
		}
		return false;
	},

	json: function(obj) {
		return JSON.stringify(obj, null, "  ");
	},

	capitalize: function(string) {
		if(typeof string === 'function') { string = string(); }
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	expand_link: function(path, html) {
		var url;

		if(typeof path === 'function') { path = path(); }
		url = HixIO.attr('meta').scheme + '://' + HixIO.attr('meta').host + '/' + path;
		if(typeof html !== 'string' ) { html = url; }

		return $('<a></a>').attr('href', url).html(html);
	},

	iso_date: function(date_arg) {
		if(typeof date_arg === 'function') { date_arg = date_arg(); }
		return (new Date(date_arg)).toISOString();
	},

	time: function(date_arg) {
		if(typeof date_arg === 'function') { date_arg = date_arg(); }
		return moment(new Date(date_arg)).format('HH:mm');
	},

	date: function(date_arg) {
		if(typeof date_arg === 'function') { date_arg = date_arg(); }
		return moment(new Date(date_arg)).format('YYYY-MM-DD');
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
		var cols, table, wrapper;

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

/******************************************************************************
 * Models
 ******************************************************************************/

/*
 * I chose to keep the models as limited in functionality as possible.
 */

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
 	current: HixIO.ajax('/auth/')
 }, {});

