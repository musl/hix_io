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
	end

	def authorize( credentials, request, perms )
	end


	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	def valid_api_token?( request )
		email = request.headers[:email]
		token = request.headers[:token]
		user = HixIO::User[email]

		return true if user and token == make_token( user, request )

		self.log_failure "Invalid API request."
	end

	def valid_login?( request )
		email = request.headers[:email]
		password = request.headers[:password]
		user = HixIO::User[email]

		return true if user and password == user.password

		self.log_failure "Invalid login."
	end

	def make_token( user, request )
		# TODO figure out what to hash.
		return ''
	end

end

