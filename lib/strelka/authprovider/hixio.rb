# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'hix_io' unless defined?( HixIO )
require 'strelka/authprovider'
require 'strelka/mixins'

# A custom AuthProvider.
#
class Strelka::AuthProvider::HixIO < Strelka::AuthProvider

	extend Configurability

	config_key :hix_io_auth

	# Configuration defaults for Configurability.
	DEFAULT_CONFIG = {}

	# Configurability hook. Configure this class with the given +section+.
	#
	def self::configure( section )
		super( section )
	end

	########################################################################
	### A U T H   H O O K S
	########################################################################

	# Determine if the +request+ was made with either valid credentials or a
	# valid session. If so, return the user referenced by the credentials or
	# the session. If not, require authentication.
	#
	def authenticate( request )
		if user = check_session( request ) || check_login( request )
			self.auth_succeeded( request, user )
			return user
		end

		self.require_authentication 'Authentication required.'
	end

	# Determine if the +request+, +credentials+, and the list of +perms+ allow
	# the user to access the given resource. If so, return true. If not, return
	# false.
	#
	def authorize( credentials, request, perms )
		return true
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Check for and return the session associated with a given +request+. Return
	# nil if none was found.
	#
	def check_session( request )
		return nil unless request.session?

		req_ip = request.headers[:x_forwarded_for]
		session_ip = request.session[:src_ip]
		user = ::HixIO::User[request.session[:id]]

		return user if user and req_ip == session_ip
	end

	# Validate credentials given in a +request+, returning the user if they were
	# valid, nil otherwise.
	#
	def check_login( request )
		request.body.rewind

		form = Hash[URI.decode_www_form( request.body.read )]
		user = ::HixIO::User.where( :email => form['email'] ).first

		if user and form['password'] == user.password
			make_session( user, request )
			return user
		end

		return
	end

	# Create a session for the given +user+ and +request+.
	#
	def make_session( user, request )
		request.session[:id] = user.id
		request.session[:src_ip] = request.headers[:x_forwarded_for]
	end

end

