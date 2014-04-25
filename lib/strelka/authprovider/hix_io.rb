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
		if user = check_session( request ) or check_login( request )
			self.auth_succeeded( request, user )
			return user
		end

		self.require_authentication 'Authentication required.'
	end

	def authorize( credentials, request, perms )
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	def check_session( request )
		return nil unless request.session?

		session_ip = request.session[:src_ip] || return
		req_ip = request.headers[:x_forwarded_for] || return
		user = ::HixIO::User[request.session[:user_id]] || return

		return user if req_ip == session_ip
	end

	def check_login( request )
		email = request.headers[:email] || return
		password = request.headers[:password] || return
		user = ::HixIO::User[email] || return

		if password == user.password
			make_session
			return user
		end

		return
	end

	def make_session( user, request )
		request.session[:user_id] = user.id
		request.session[:src_ip] = request.headers[:x_forwarded_for]
	end

end

