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

	json: function(obj) {
		return JSON.stringify(obj, null, "  ");
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
HixIO.User = can.Model.extend({}, {});

