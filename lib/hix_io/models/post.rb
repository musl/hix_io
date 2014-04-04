# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::Post < Sequel::Model( :hix_io__posts )

	dataset_module do

		# Fetch a list of published posts.
		#
		# Recognized keys in +params+:
		#
		# :offset => Passed to the offset SQL clause.
		# :limit  => Passed to the limit SQL clause.
		#
		def published( params = {} )
			set = self.where( :published => true ).order( :updated_at )
			set = set.offset( params[:offset] ) unless params[:offset].nil?
			set = set.limit( params[:limit] ) unless params[:limit].nil?
			return set
		end

		# Fetch a published post with the given +id+.
		#
		def detail( id )
			return self.where( :id => id, :published => true )
		end

		# Perform a full-text search with a limited number of terms.
		#
		# Recognized keys in +params+:
		#
		# :q          => The query string.
		# :offset     => Passed to the offset SQL clause.
		# :limit      => Passed to the limit SQL clause.
		# :language   => Language. defaults to 'english'
		# :max_length => Queries longer than this will be truncated to this many
		#                characters. defaults to 100
		#
		def search( params = {} )
			qmax = params[:max_length] || 100
			opts = { :language => (params[:language] || 'english') }
			terms = params[:q].to_s.slice( 0..qmax ).split( /[\s]+/ ).reject( &:empty? )

			return self.nullify if terms.empty?

			set = self.published.full_text_search( [:title, :body], terms, opts )
			set = set.offset( params[:offset] ) unless params[:offset].nil?
			set = set.limit( params[:limit] ) unless params[:limit].nil?

			return set
		end

	end

end

