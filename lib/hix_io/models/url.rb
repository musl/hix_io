# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'zlib'
require 'uri'

# Class to describe a shortened URL.
#
class HixIO::URL < Sequel::Model( HixIO::table_symbol( :urls ) )

	plugin :validation_helpers
	plugin :json_serializer

	unrestrict_primary_key

	many_to_one :user

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do

		# Return a dataset that will yield the top URLs by hit.
		#
		def top
			return self.order( Sequel.desc( :hits ) )
		end

		# Returns a dataset that will yield the top URLs by creation time.
		#
		def latest
			return self.order( Sequel.desc( :ctime ) )
		end

	end

	########################################################################
	### H O O K S
	########################################################################

	# Sequel validation hook.
	#
	def validate
		super
		validates_presence [:url, :source_ip]
		validates_unique [:url, :short]
		errors.add( :url, "invalid" ) unless valid_url?
	end

	# Sequel hook. Updates a dependent column.
	#
	def before_save
		self.short = Zlib::crc32( self.url.to_s ).to_s( 36 ).rjust( 7, '0' )
		super
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Validate the value of this instance's +url+ column.
	#
	def valid_url?
		url = URI( self.url )

		return false unless url.scheme and url.host
		return false if	url.host =~ /#{HixIO.host}\.?$/i
		return true
	rescue URI::InvalidURIError
		return false
	end

end

