# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'digest/sha2'
require 'securerandom'

# Class to describe a user account.
#
class HixIO::User < Sequel::Model( :hix_io__users )

	unrestrict_primary_key

	plugin :validation_helpers
	plugin :json_serializer

	one_to_many :posts
	one_to_many :urls, :class => HixIO::URL

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do
	end

	########################################################################
	### H O O K S
	########################################################################

	# Validates this model.
	#
	def validate
		validates_presence( :password )
	end

	# Create identity information.
	#
	def before_create
		self.api_secret = Digest::SHA512.hexdigest( SecureRandom.random_bytes( 128 ))
		super
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Validate the given URL.
	#
	def valid_user?
	end

	# Override & cripple to_json. There can only be one!
	#
	def to_json( *a )
		return super( :except => [:password, :api_secret] )
	end

end

