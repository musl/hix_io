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
		user = check_session || check_login
		self.require_authentication 'Not authentic.'
		return false
	end

	def authorize( credentials, request, perms )
		return true
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	def check_session(valid_session?( request )
		return nil unless request.session?

		session_ip = request.session[:src_ip] || return nil
		req_ip = request.headers[:x_forwarded_for] || return nil
		user = HixIO::User[request.session[:user_id]] || return nil

		return user if req_ip == session_ip
	end

	def check_login( request )
		email = request.headers[:email] || return nil
		password = request.headers[:password] || return nil
		user = HixIO::User[email] || return nil

		if password == user.password
			make_session
			return user
		end

		return nil
	end

	def make_session( user, request )
		req.session[:user_id] = user.id
		req.session[:src_ip] = req.headers[:x_forwarded_for]
	end

end

