#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO ) do

	it 'can configure itself' do
		expect( subject.config ).to be_a Configurability::Config::Struct
	end

	it 'raises an error when unable to load a configuration file' do
		stub_const( 'HixIO::CONFIG_PATHS', [] )
		expect{ subject.load_config }.to raise_error( RuntimeError, /unable to load configuration/i )
	end

	it 'requires a schema ending in "_dev" when in development mode' do
		conf = subject.config
		conf.dev = true
		conf.schema = ''
		expect { subject.configure( conf ) }.to raise_error( /dev mode/i )
	end

	it 'can connect to a database' do
		expect( subject.db ).to be_a Sequel::Database
	end

	it 'loads at least one model' do
		expect( subject.models.values.length ).to be > 0
	end

	it 'propigates the database handle to all loaded models' do
		subject.models.values.each do |model|
			expect( model.db ).to equal subject.db
		end
	end

end

