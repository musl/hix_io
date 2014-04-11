# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'pathname'
require 'loggability'
require 'configurability'
require 'sequel'

# Top-level Application Namespace
#
module HixIO

	require 'hix_io/constants'
	include Constants

	extend Loggability
	log_as :hix_io

	extend Configurability
	config_key :hix_io

	#####################################################################
	### C O N F I G U R A T I O N
	#####################################################################

	class << self
		# The loaded config.
		attr_reader :config

		# The database handle.
		attr_reader :db

		# The list of loaded models.
		attr_reader :models
	end

	# Defaults for app-wide config.
	#
	DEFAULT_CONFIG = {
		self.config_key => {
			:domain => 'hix.io',
			:db_uri => 'postgres://hix_io@localhost/hix_io',
			:skip_models => false,
			:dev => false,
		}
	}.freeze

	# Load the app-wide config from the specified +path+. You may also override
	# any of the defaults for the namespace at runtime by passing in +opts+, a
	# hash that will be merged against the namespace's section of config.
	#
	def self::load_config( path, opts = {} )
		defaults = DEFAULT_CONFIG
		defaults[self.config_key].merge!( opts )
		Configurability::Config.load( path, defaults ).install
	end

	# Configurability hook. This is called with this class's +section+ of the config
	# while the configuration is being installed.
	#
	def self::configure( section )
		super( section )

		Sequel.extension :core_extensions

		# Molly guard. Hopefully this makes it harder tromp on the production database.
		#
		if self.dev? and self.config.db_uri !~ /dev$/
			raise "We're in dev mode and the database name doesn't end in 'dev'."
		end

		self.log.level = :debug if self.dev?

		@db ||= Sequel.connect( self.config.db_uri, :logger => self.log )
		self.db.sql_log_level = :debug

		self.db.extension :pg_json
		self.db.extension :null_dataset
		self.db.extension :pg_inet

		# We may not want to load models at runtime. For example, if
		# we're only interested in constants, utilities, or low-level
		# database access, if we're migrating, etc.
		#
		return if self.config.skip_models

		# If we don't need to set the database handle at runtime, we can simply set
		# the proper database handle for Sequel here, and all models loaded after
		# this point will do the right thing.
		Sequel::Model.db = self.db

		Sequel::Model.plugin :json_serializer
		Sequel::Model.plugin :timestamps, :update_on_create => true

		self.load_models

		return
	end

	# Require all of the models present in this gem and keep track of the classes
	# that were added to the namespace.
	#
	def self::load_models
		@models ||= []

		Dir[MODEL_DIR + '*.rb'].each do |f|
			snap = constants
			next unless require f
			begin
				@models << const_get( (constants - snap).first )
			rescue NameError, TypeError
			end
		end

		return @models
	end

	# Are we in development mode?
	#
	def self::dev?
		return self.config.dev
	end

	# Return this app's domain
	#
	def self::domain
		return self.config.domain
	end

end

