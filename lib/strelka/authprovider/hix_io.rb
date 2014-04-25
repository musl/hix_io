# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

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
		return true if valid_session? or valid_login? or valid_api_token?
		self.log_failure 'Not authentic.'
	end

	def authorize( credentials, request, perms )
		return true
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	def valid_session?( request )
	end

	def valid_api_token?( request )
		email = request.headers[:email]
		token = request.headers[:token]
		user = HixIO::User[email]

		return false if user.nil?

		return true if token == make_token( user, request )

		return false
	end

	def valid_login?( request )
		email = request.headers[:email]
		password = request.headers[:password]
		user = HixIO::User[email]

		return false if user.nil?

		if password == user.password
			make_session
			return true
		end

		return false
	end

	def make_token( user, request )
		# TODO figure out what to hash.
		return ''
	end

	def make_session( user, request )
		req.session[:user_id] = user.id
	end

end

