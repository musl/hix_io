# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::Post < Sequel::Model( :hix_io__posts )

	dataset_module do

		def published( params = {} )
			offset = params[:offset] || 0
			limit =  params[:limit]  || 10
			return self.where( :published => true ).order( :updated_at ).offset( offset ).limit( limit ).all
		end

		def detail( id )
			return self.where( :id => id, :published => true ).first
		end

		def published_count
			return self.where( :published => true ).count
		end

		def search( params = {} )
			# We'll trust sequel's quoting here, for now. I'd like to make sure it does
			# the right thing at some point.
			cols   = [:title, :body]
			terms  = [params[:q].split( /\s+/ )].flatten
			opts   = {
				:language => (params[:language] || 'english'),
			}
			offset = params[:offset] || 0
			limit  = params[:limit] || 10
			return self.full_text_search( cols, terms, opts ).offset( offset ).limit( limit ).all
		end

	end

end

