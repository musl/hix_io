/* vim: set nosta noet ts=4 sw=4 ft=javascript: */

'use strict';

/******************************************************************************
 * Routed Controls
 ******************************************************************************/

/*
 * A control for a shared photo timeline.
 */
HixIO.DefaultControl = can.Control.extend({
	defaults: {
		view: 'home'
	}
}, {
	'route': function() {
		this.element.html(HixIO.view(this.options.view, {}));
	}
});

/*
 * A control for shortening urls.
 */
HixIO.URLControl = can.Control.extend({
	defaults: {
		view: 'urls'
	}
}, {
	'urls route': function() {
		var self;

		self = this;

		HixIO.URL.summary().success(function(data) {
			self.element.html(HixIO.view(
				self.options.view,
				{
					scheme: HixIO.attr('meta').scheme,
					host: HixIO.attr('meta').host,
					top_urls: HixIO.URL.models(data.top),
					latest_urls: HixIO.URL.models(data.latest),
					url: self.url,
				}
			));
		}).error(function(data) {
			console.log("Error fetching URLs. Status: " + data.status);
			self.element.html('Error fetching URLs.');
		});
	}
});

/******************************************************************************
 * Application entry point.
 ******************************************************************************/

$(document).ready(function() {
	can.each([
		HixIO.DefaultControl,
		HixIO.URLControl
	], function(Control) {
		return new Control('#main');
	});
	can.route.ready();
});
