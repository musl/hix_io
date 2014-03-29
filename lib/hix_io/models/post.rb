# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::Post < Sequel::Model( :hix_io__posts )

	dataset_module do

		def published( params = {} )
			set = self.where( :published => true ).order( :updated_at )
			set = set.offset( params[:offset] ) unless params[:offset].nil?
			set = set.limit( params[:limit] ) unless params[:limit].nil?
			return set
		end

		def detail( id )
			return self.where( :id => id, :published => true )
		end

		def search( params = {} )
			# We'll trust sequel's quoting here, for now. I'd like to make sure it does
			# the right thing at some point.
			terms = [params[:q].to_s.split( /\s+/ )].flatten
			opts  = {
				:language => (params[:language] || 'english')
			}

			set = self.published.full_text_search( [:title, :body], terms, opts )
			set = set.offset( params[:offset] ) unless params[:offset].nil?
			set = set.limit( params[:limit] ) unless params[:limit].nil?
			return set
		end

	end

end

