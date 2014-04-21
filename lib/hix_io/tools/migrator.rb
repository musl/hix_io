#!/usr/bin/env ruby
# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'fileutils'
require 'pathname'

require 'hix_io'

module HixIO::Tools
	class Migrator

		extend Loggability

		log_as :hix_io_migrator

		def self.run!( opts = {} )
			HixIO.load_config( opts[:config], :skip_models => true )
			Loggability.level = opts[:debug] ? :debug : :info

			Sequel.extension :migration

			klass = Sequel::Migrator.migrator_class( HixIO::MIGRATION_DIR )

			migrator = klass.new( HixIO.db, HixIO::MIGRATION_DIR, :target => opts[:target] )
			migrator.run

			migrator = klass.new( HixIO.db, HixIO::MIGRATION_DIR )
			self.log.info "At version %d." % [migrator.current]
		end

	end
end

