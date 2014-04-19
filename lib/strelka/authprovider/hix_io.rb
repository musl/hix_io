# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'strelka/authprovider'
require 'strelka/mixins'

class Strelka::AuthProvider::HixIO < Strelka::AuthProvider

	extend Configurability

	config_key :hix_io_auth

	class << self
		attr_reader :allowed_netblocks
	end

	DEFAULT_CONFIG = {
		:allowed_netblocks => '127.0.0.1/32'
	}

	def self::allowed_netblocks=( newblocks )
		@allowed_netblocks = Array( newblocks ).map {|addr| IPAddr.new(addr) }
	end

	def self::configure( section )
		super( section )
		self.allowed_netblocks = section[:allowed_netblocks]
		self.log.debug( '%p: allowed_netblocks: %p' % [self, allowed_netblocks] )
	end

	def authorize( credentials, request, perms )
		x_forwarded_for = request.header.x_forwarded_for or
			raise "No X-Forwarded-For header?!"
		ipaddr = IPAddr.new( x_forwarded_for )

		unless self.class.allowed_netblocks.any? {|nb| nb.include?(ipaddr) }
			finish_with( HTTP::FORBIDDEN, 'You are not authorized to shorten URLs' )
			return false
		end

		return true
	end

end

