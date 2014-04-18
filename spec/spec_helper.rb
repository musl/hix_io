#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

# SimpleCov test coverage reporting; enable this using the :coverage rake task
# http://rubydoc.info/gems/simplecov/frames
#
if ENV['COVERAGE']
	require 'json'
	require 'simplecov'
	SimpleCov.start do
		coverage_dir 'data/hix_io/static/docs/coverage'

		add_filter 'spec'
		add_filter 'data/hix_io/migrations'

		add_group( "Apps", 'data/hix_io/apps' )
		add_group( "Models", 'lib/hix_io/models' )
		add_group( "Not Fully Tested" ) { |file| file.covered_percent < 100 }
	end
end

require 'hix_io'

HixIO.load_config( 'etc/config.yml' )
HixIO.log.level = :fatal

def migrate!
	raise "Hold on there, buddy. We're not in developer mode!" unless HixIO.dev?

	Sequel.extension :migration

	klass = Sequel::Migrator.migrator_class( HixIO::MIGRATION_DIR )

	# Ground Zero
	migrator = klass.new( HixIO.db, HixIO::MIGRATION_DIR, :target => 0 )
	migrator.run

	# Latest Migration
	migrator = klass.new( HixIO.db, HixIO::MIGRATION_DIR, :target => nil )
	migrator.run

	return nil
end

RSpec.configure do |config|
  config.formatter = :documentation # :progress, :html, :textmate
  config.color_enabled = true
  #config.tty = true
end

