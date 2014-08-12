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

	no_auth_for { |req| req.verb == :GET }
	no_perms_for { |req| req.verb == :GET }

	########################################################################
	### R O U T E S
	########################################################################

	get '/posts' do |req|
		req.params.add :offset, :integer
		req.params.add :limit, :integer

		posts = HixIO::Post.published( req.params ).all.map do |post|
			hash = post.to_hash
			hash[:user] = post.user
			hash
		end

		res = req.response
		res.for( :json ) { posts }
		return res
	end

	get '/posts/:id' do |req|
		post =  HixIO::Post.detail( req.params[:id] ).first
		user = post.user
	    post = post.to_hash
		post[:user] = user

		res = req.response
		res.for( :json ) { post }
		return res
	end

	put '/posts/:id' do |req|
		req.params.add :title, :string
		req.params.add :body, :string

		post = HixIO::Post[req.params[:id]] || finish_with( HTTP::NOT_FOUND, '' )

		res = req.response
		res.for( :json ) do
			begin
				post.update(
					:title => req.params[:title],
					:body => req.params[:body]
				)
			rescue Sequel::ValidationFailed => e
				finish_with( HTTP::UNPROCESSABLE_ENTITY, e )
			end
		end
		return res
	end

	delete '/posts/:id' do |req|
		post = HixIO::Post[req.params[:id]] || finish_with( HTTP::NOT_FOUND, '' )

		res = req.response
		res.for( :json ) { post.delete }
		return res
	end

	get '/urls' do |req|
		res = req.response
		res.for( :json ) { HixIO::URL.all }
		return res
	end

	get '/urls/summary' do |req|
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
					url.user_id = req.authenticated_user.id
				end
			rescue Sequel::ValidationFailed => e
				finish_with( HTTP::UNPROCESSABLE_ENTITY, e )
			end
		end
		return res
	end

	get '/dash' do |req|
		res = req.response
		res.for( :json ) {{
			:posts => HixIO::Post.count,
			:urls => HixIO::URL.count,
			:photo_sets => HixIO::PhotoSet.count,
			:photos => HixIO::Photo.count,
			:users => HixIO::User.count,
			:sessions => HixIO.db[:sessions].count,
			:schema => HixIO.db[:schema_info].first[:version]
		}}
		return res
	end

	put '/users/:id' do |req|
		req.params.add :email
		req.params.add :name, :string
		req.params.add :password, :sha512sum

		user = HixIO::User[req.params[:id]] || finish_with( HTTP::NOT_FOUND, '' )

		res = req.response
		res.for( :json ) do
			begin
				user.update({
					:email => req.params[:email],
					:name => req.params[:name],
					:password => req.params[:password],
				})
			rescue Sequel::ValidationFailed => e
				finish_with( HTTP::UNPROCESSABLE_ENTITY, e )
			end
		end
		return res
	end

end

