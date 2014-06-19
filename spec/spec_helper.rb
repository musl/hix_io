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

		add_group( "Handlers", 'lib/hix_io/handlers' )
		add_group( "Models", 'lib/hix_io/models' )
		add_group( "Not Fully Tested" ) { |file| file.covered_percent < 100 }
	end
end

TEST_APP_PARAMS =  %w[test-app tcp://127.0.0.1:9998 tcp://127.0.0.1:9999]

require 'mongrel2'
require 'mongrel2/testing'
require 'pathname'

require 'hix_io'

include Mongrel2::Constants

HixIO.load_config( 'etc/config.yml' )

def prep_db!
	raise "Hold on there, buddy. We're not in developer mode!" unless HixIO.dev?
	HixIO.models.values.each { |model| model.dataset.delete }
	HixIO.db[:sessions].delete
	return nil
end

RSpec.configure do |config|
  config.formatter = :documentation # :progress, :html, :textmate
  config.color = true
end

