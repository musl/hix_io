#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO ) do

	it 'can configure itself' do
		expect( subject.config ).to be_a Configurability::Config::Struct
	end

	it 'can connect to a database' do
		expect( subject.db ).to be_a Sequel::Database
	end

	it 'loads at least one model' do
		expect( subject.models ).to have_at_least( 1 ).things
	end

	it 'propigates the database handle to all loaded models' do
		subject.models.each do |model|
			expect( model.db ).to equal subject.db
		end
	end

	it 'checks the db uri when in dev mode' do
		conf = subject.config
		conf.dev = true
		conf.db_uri = "sqlite:/"
		expect { subject.configure( conf ) }.to raise_error( /dev mode/i )
	end

end

