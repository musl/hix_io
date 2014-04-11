# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'zlib'
require 'uri'

# Class to describe a blog post.
#
class HixIO::URL < Sequel::Model( :hix_io__urls )

	def self.shorten( params = {} )
		url = URI( params[:url] )

		HixIO.log.warn params

		unless url.scheme and url.host
			raise ArgumentError, 'Invalid URL.'
		end

		if url.host =~ /#{HixIO.domain}\.?$/i
			raise ArgumentError, 'Unacceptable URL.'
		end

		short = Zlib::crc32( url.to_s ).to_s( 36 )

		return self.create( :url => url, :short => short, :source_ip => params[:source_ip] )
	end

	dataset_module do

		def top
			return self.order_by( :hits )
		end

		def latest
			return self.order_by( :created_at )
		end

	end

end

