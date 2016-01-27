# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'hix_io' unless defined?( HixIO )
require 'strelka/authprovider'
require 'strelka/mixins'

# A custom AuthProvider.
#
class Strelka::AuthProvider::HixIO < Strelka::AuthProvider

	########################################################################
	### A U T H   H O O K S
	########################################################################

	# Determine if the +request+ was made with either valid credentials or a
	# valid session. If so, return the user referenced by the credentials or
	# the session. If not, require authentication.
	#
	def authenticate( request )
		if user = check_session( request ) ||
			check_login( request )
			self.auth_succeeded( request, user )
			return user
		end

		self.require_authentication 'Authentication required.'
	end

	# Determine if the +request+, +credentials+, and the list of +perms+ allow
	# the user to access the given resource. If so, return true. If not, return
	# false.
	#
	# For now, this just permits everything.
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
		unless request.session?
			self.log.debug('no session found')
			return nil
		end

		req_ip = request.headers[:x_forwarded_for] || request.remote_ip
		session_ip = request.session[:src_ip]
		user = ::HixIO::User[request.session[:email]]

		if !user.nil? and req_ip == session_ip
			self.log.debug('session checks out')
			return user
		end

		self.log.debug('Invalid session. user: %s session ip: %s req ip: %s' % [user,session_ip,req_ip])
		return false
	end

	# Validate credentials given in a +request+, returning the user if they were
	# valid, nil otherwise.
	#
	def check_login( request )

		# TODO: find a better way to control which routes can create sessions.
		HixIO.log.debug( "%p: %p" % [request.path, request.verb] )
		return unless request.path =~ /\/(auth)?/ and request.verb == :POST

		request.body.rewind

		form = Hash[URI.decode_www_form( request.body.read )]
		self.log.debug "Form: %p" % [form]
		user = ::HixIO::User.where( :email => form['email'] ).first

		if user && user.check_password( form['password'] )
			make_session( user, request )
			return user
		end

		return
	end

	# Create a session for the given +user+ and +request+.
	#
	def make_session( user, request )
		request.session[:email] = user.email
		request.session[:src_ip] = request.headers[:x_forwarded_for] || req.remote_ip
	end

end

