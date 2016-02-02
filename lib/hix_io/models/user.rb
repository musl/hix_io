# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'configurability'
require 'digest/sha2'
require 'securerandom'
require 'bcrypt'

# Class to describe a user account.
#
class HixIO::User < Sequel::Model( HixIO.table_symbol( :users ) )

	include BCrypt

	# The primary key for this model is a mutable string.
	unrestrict_primary_key

	plugin :validation_helpers
	plugin :json_serializer

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
		self.password = BCrypt::Password.create( self.password )
		super
	end

	# Check a string against thiis user's password.
	#
	def check_password( password )
		return BCrypt::Password.new( self.password ) == password
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Prevent secrets from being sent with user data.
	#
	def to_json( *_ ) #:nodoc:
		return super( :except => [:password, :api_secret] )
	end

end
