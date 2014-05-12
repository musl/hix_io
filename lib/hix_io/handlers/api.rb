# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'strelka'
require 'hix_io'

# Provides REST resources for the application.
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

	no_auth_for { |req| req.verb == :GET }
	no_perms_for { |req| req.verb == :GET }

	########################################################################
	### R O U T E S
	########################################################################

	get '/posts' do |req|
		req.params.add :offset, :integer
		req.params.add :limit, :integer

		res = req.response
		res.for( :json ) {{
			:count => HixIO::Post.published.count,
			:posts => HixIO::Post.published( req.params ).all,
		}}
		return res
	end

	get '/posts/:id' do |req|
		res = req.response
		res.for( :json ) { HixIO::Post.detail( req.params[:id] ).first }
		return res
	end

	get '/urls' do |req|
		res = req.response
		res.for( :json ) {{
			:host => HixIO.host,
			:top_urls => HixIO::URL.top.limit( 10 ).all,
			:latest_urls => HixIO::URL.latest.limit( 10 ).all,
		}}
		return res
	end

	post '/urls' do |req|
		req.params.add :url, :string

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
