# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'strelka'
require 'hix_io'

# Provides routes for authentication and session management.
#
class HixIO::Auth < Strelka::App

	extend Loggability
	log_to :hix_io

	plugins \
		:auth,
		:routing,
		:negotiation,
		:sessions

	default_type 'text/plain'

	session_namespace :hix_io

	require_auth_for { |r| %i[GET DELETE].include?( r.verb ) }
	no_perms_for //

	########################################################################
	### R O U T E S
	########################################################################

	get '/' do |req|
		res = req.response
		res.for( :json ) { req.authenticated_user }
		return res
	end

	post '/' do |req|
		res = req.response
		user = self.auth_provider.authenticate( req ) ||
			finish_with( HTTP::SERVER_ERROR, 'Who are you?' )
		res.for( :json ) { user }
		return res
	end

	delete '/' do |req|
		res = req.response
		res.destroy_session if res.session?
		# Freakin' browsers. I'd like to use 204 here, but when a response with no
		# Content-Type header and an *empty* body comes back, Firefox tries to parse
		# the body as XML.
		#finish_with( HTTP::NO_CONTENT )
		res.for( :json ) { '' }
		return res
	end

end
