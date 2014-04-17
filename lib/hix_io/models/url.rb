# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'zlib'
require 'uri'

# Class to describe a blog post.
#
class HixIO::URL < Sequel::Model( :hix_io__urls )

	plugin :validation_helpers

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do

		def top
			return self.order( Sequel.desc( :hits ) )
		end

		def latest
			return self.order( Sequel.desc( :created_at ) )
		end

	end

	########################################################################
	### H O O K S
	########################################################################

	# Validates this model.
	#
	def validate
		super
		validates_presence [:url, :source_ip]
		validates_unique [:url, :short]
		errors.add( :url, "invalid" ) unless valid_url?
	end

	# Updates a dependent column.
	#
	def before_save
		self.short = Zlib::crc32( self.url.to_s ).to_s( 36 )
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	#######
	private
	#######

	# Validate the given URL.
	#
	def valid_url?
		url = URI( self.url )

		return false unless url.scheme and url.host
		return false if	url.host =~ /#{HixIO.domain}\.?$/i
		return true
	rescue URI::InvalidURIError
		return false
	end

end

