# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'zlib'
require 'uri'

# Class to describe a blog post.
#
class HixIO::URL < Sequel::Model( :hix_io__urls )

	def self.shorten( params = {} )
		url = URI( params[:url] )

		unless url.scheme and url.host
			raise ArgumentError, 'Invalid URL.'
		end

		if url.host =~ /#{HixIO.domain}(\.)?$/i
			raise ArgumentError, 'Unacceptable URL: %s' % [params[:url]]
		end

		short = Zlib::crc32( url.to_s ).to_s( 36 )

		return self.find_or_create( :url => url.to_s ) { |u|
			u.short = short
			u.source_ip = params[:source_ip]
		}
	end

	dataset_module do

		def top
			return self.order( Sequel.desc( :hits ) )
		end

		def latest
			return self.order( Sequel.desc( :created_at ) )
		end

	end

end

