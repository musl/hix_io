# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

# Class to describe a blog post.
#
class HixIO::PhotoSet < Sequel::Model( :hix_io__photo_sets )

	plugin :validation_helpers
	plugin :json_serializer

	many_to_one :user, :eager => [:user]
	one_to_many :photos

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

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Override & cripple to_json. There can only be one!
	#
	def to_json( *a ) #:nodoc:
		return super( :include => :user )
	end

end

