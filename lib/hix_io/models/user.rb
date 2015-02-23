# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'digest/sha2'
require 'securerandom'

# Class to describe a user account.
#
class HixIO::User < Sequel::Model( HixIO.table_symbol( :users ) )

	plugin :validation_helpers
	plugin :json_serializer

	unrestrict_primary_key

	one_to_many :urls, :class => HixIO::URL

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do
		# TODO - create datasets for user management.
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
		self.generate_api_secret
		super
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Generate a new API secret for his user.
	#
	def generate_api_secret
		self.api_secret = Digest::SHA512.hexdigest( SecureRandom.random_bytes( 128 ))
	end

	# Prevent secrets from being sent with user data.
	#
	def to_json( *_ ) #:nodoc:
		return super( :except => [:password, :api_secret] )
	end

end

