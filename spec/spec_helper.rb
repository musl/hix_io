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
		coverage_dir 'docs/coverage'
		add_filter 'spec'
		#add_filter 'var'
		#add_group "Strelka Extensions", "lib/strelka"
		#add_group "Models" do |file|
		#	file.lines.any?{|line| line.source =~ /< Sequel::Model\(/ }
		#end
		#add_group "Needing tests" do |file|
		#	file.covered_percent < 90
		#end
	end
end

require 'hix_io'

HixIO.load_config( 'etc/config.yml' )

# TODO:
#
# - Create a testing config (data section?)
# - test database hooks
# - Create fixtures
#

RSpec.configure do |config|
  config.formatter = :documentation # :progress, :html, :textmate
  config.color_enabled = true
  #config.tty = true
end

