# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'hix_io' unless defined?( HixIO )
require 'strelka/authprovider'
require 'strelka/mixins'

class Strelka::AuthProvider::HixIO < Strelka::AuthProvider

	extend Configurability

	config_key :hix_io_auth

	DEFAULT_CONFIG = {}

	def self::configure( section )
		super( section )
	end

	########################################################################
	### A U T H   H O O K S
	########################################################################

	def authenticate( request )
		if user = check_session( request ) || check_login( request )
			self.auth_succeeded( request, user )
			return user
		end

		self.require_authentication 'Authentication required.'
	end

	def authorize( credentials, request, perms )
		return true
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	def check_session( request )
		return nil unless request.session?

		req_ip = request.headers[:x_forwarded_for]
		session_ip = request.session[:src_ip]
		user = ::HixIO::User[request.session[:email]]

		return user if user and req_ip == session_ip
	end

	def check_login( request )
		request.body.rewind

		form = Hash[URI.decode_www_form( request.body.read )]
		user = ::HixIO::User[form['email']]

		if user and form['password'] == user.password
			make_session( user, request )
			return user
		end

		return
	end

	def make_session( user, request )
		request.session[:email] = user.email
		request.session[:src_ip] = request.headers[:x_forwarded_for]
	end

end

