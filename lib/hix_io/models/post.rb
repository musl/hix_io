# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::Post < Sequel::Model( :hix_io__posts )

	plugin :validation_helpers
	plugin :json_serializer

	many_to_one :user

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do

		# Fetch a list of published posts.
		#
		# Recognized keys in +params+:
		#
		# - +:offset+
		#   Passed to the offset SQL clause.
		# - +:limit+
		#   Passed to the limit SQL clause.
		#
		def published( params = {} )
			set = self.where( :published => true ).order( :mtime ).reverse
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
		# - +:q+
		#   The query string.
		# - +:offset+
		#   Passed to the offset SQL clause.
		# - +:limit+
		#   Passed to the limit SQL clause.
		# - +:language+
		#   Language. defaults to 'english'
		# - +:max_length+
		#   Queries longer than this will be truncated to this many characters. defaults to 100
		#
		def search( params = {} )
			qmax = params[:max_length] || 100
			opts = { :language => (params[:language] || 'english') }
			terms = params[:q].to_s.strip.downcase.slice( 0..qmax ).split( /[\s]+/ ).reject( &:empty? )

			return self.nullify if terms.empty?

			set = self.published.full_text_search( [:title, :body], terms, opts )
			set = set.offset( params[:offset] ) unless params[:offset].nil?
			set = set.limit( params[:limit] ) unless params[:limit].nil?

			return set
		end
	end

	########################################################################
	### H O O K S
	########################################################################

	# Validation hook for Sequel.
	#
	def validate
		validates_presence( :title )
		validates_presence( :body )
	end

end

