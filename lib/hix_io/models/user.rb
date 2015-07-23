# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'configurability'
require 'digest/sha2'
require 'securerandom'

# Class to describe a user account.
#
class HixIO::User < Sequel::Model( HixIO.table_symbol( :users ) )

	plugin :validation_helpers
	plugin :json_serializer

	unrestrict_primary_key

	one_to_many :urls, :class => HixIO::URL

	extend Configurability
	config_key :hix_io_user

	# Configuration defaults for Configurability.
	DEFAULT_CONFIG = {
		salt: nil,
		digest: 'sha512'
	}

	# Supported Digests
	DIGESTS = {
		'sha2' => Digest::SHA2,
		'sha256' => Digest::SHA256,
		'sha384' => Digest::SHA384,
		'sha512' => Digest::SHA512
	}

	class << self
		# A salt for hashing passwords. It's a required part of the
		# configuration. Set +salt+ to a long, random string for best
		# results.
		attr_reader :salt

		# A digest for hashing passwords. This is configurable with
		# the +digest+ key. Supported digests are: SHA2, SHA256,
		# SHA384, and SHA512.
		attr_reader :digest
	end

	########################################################################
	### D A T A S E T S
	########################################################################

	dataset_module do
		# TODO - create datasets for user management.
	end

	########################################################################
	### H O O K S
	########################################################################

	# Configurability hook. Configure this class with the given +section+.
	#
	def self::configure( section )
		super( section )

		abort( 'No config for %s found. Please provide a section called "%s" that includes a salt.' % [self.name, self.config_key] ) if section.nil?

		@salt = section[:salt] || abort( 'You must provide a salt for hashing passwords.' )

		digest_name = (section[:digest] || DEFAULT_CONFIG[:digest]).downcase
		@digest = DIGESTS[digest_name] || abort( 'Invalid digest: "%s"' % [digest_name] )
	end

	# Validates this model.
	#
	def validate
		validates_presence( :password )
	end

	# Create identity information.
	#
	def before_create
		self.api_secret = self.class.make_api_secret
		self.password = self.class.hash_password( self.password )
		super
	end

	########################################################################
	### C L A S S   M E T H O D S
	########################################################################

	# Hash a password.
	#
	def self::hash_password( pass )
		return self.digest.hexdigest( self.salt + pass )
	end

	# Generate an API secret.
	#
	def self::make_api_secret
		return self.digest.hexdigest( SecureRandom.random_bytes( 128 ) )
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
