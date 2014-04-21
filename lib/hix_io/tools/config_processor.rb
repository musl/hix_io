#!/usr/bin/env ruby
# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'fileutils'
require 'pathname'

require 'hix_io'
require 'loggability'
require 'mongrel2/config'

module HixIO::Tools
	class ConfigProcessor

		extend Loggability,
			Mongrel2::Config::DSL,
			FileUtils

		log_as :hix_io_config_processor

		def self.run!( opts = {} )
			debug = opts[:debug]
			Loggability.level = debug ? :debug : :info

			etc_dir = Pathname( opts[:etc_dir] ).expand_path
			self.log.info 'Entering: %s' % [etc_dir]

			Pathname.glob( etc_dir + '*.conf.rb' ).each do |conf|
				db_file = Pathname( conf.sub( /.conf.rb$/, '.sqlite' ) )

				self.log.info 'Rebuilding: %s' % [db_file.basename]
				rm_rf( db_file ) if db_file.exist?
				Mongrel2::Config.configure( :configdb => db_file.to_s )
				Mongrel2::Config.init_database!

				self.log.info 'Loading %s' % [conf.basename]
				# FIXME Is this safe in this context?
				eval( File.read( conf ) )
			end
		end

	end
end
