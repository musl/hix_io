# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'strelka'
require 'hix_io'

# Provides a REST-like API for the application.
#
class HixIO::API < Strelka::App

	extend Loggability
	log_to :hix_io

	plugins \
		:auth,
		:routing,
		:negotiation,
		:parameters,
		:sessions

	session_namespace :hix_io

	param :id, :integer
	param :class_name, :string

	default_type 'application/json'

	router :exclusive

	# FIXME: Revisit this when adding other models.
	no_auth_for { |req| req.verb == :GET }

	########################################################################
	### R O U T E S
	########################################################################

	# Return a summary of shortened URLs.
	#
	get '/urls/summary' do |req|
		res = req.response
		res.for( :json ) {{
			:latest => HixIO::URL.latest.all,
			:top => HixIO::URL.top.all
		}}
		return res
	end

	# Allow an authenticated user to shorten a URL.
	#
	post '/urls' do |req|
		req.params.add :url, :string

		finish_with( HTTP::UNAUTHORIZED ) if req.authenticated_user.nil?

		res = req.response
		res.for( :json ) do
			begin
				HixIO::URL.find_or_create( :url => req.params[:url] ) do |url|
					url.source_ip = [req.headers.x_forwarded_for].flatten.first
					url.user_id = req.authenticated_user.email
				end
			rescue Sequel::ValidationFailed => e
				finish_with( HTTP::UNPROCESSABLE_ENTITY, e )
			end
		end
		return res
	end

end
