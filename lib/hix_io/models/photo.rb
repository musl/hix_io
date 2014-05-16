# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::Photo < Sequel::Model( :hix_io__photos )

	plugin :validation_helpers
	plugin :json_serializer

	many_to_one :photo_set

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do
	end

	########################################################################
	### H O O K S
	########################################################################

	# Validation hook for Sequel.
	#
	def validate
	end

end

