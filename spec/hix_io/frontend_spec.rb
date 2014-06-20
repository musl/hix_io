#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'hix_io/handlers/frontend'

describe( HixIO::Frontend ) do

	before( :all ) do
		prep_db!
		Strelka::App::Auth.configure( HixIO.global_config.auth )
	end

	after( :all ) { prep_db! }

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :user ) { find_a_user }

	let( :short_url ) do
		user.add_url({
			:url => 'http://example.com',
			:source_ip => '127.0.0.1'
		})
	end

	subject do
		described_class.new( *TEST_APP_PARAMS )
	end

	it 'rejects unknown methods' do
		req = factory.put( '/' )
		req.content_type = 'application/x-www-form-encoded'
		req.body = 'wh=aaaaaat'

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::METHOD_NOT_ALLOWED )
		expect( res.body.read ).to match( /method not allowed/i )
	end

	it 'serves the main application' do
		HixIO.config.dev = false
		req = factory.get( '/' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect( res.body.read ).to match( /doctype html/i )
	end

	it 'serves the main application in dev mode' do
		HixIO.config.dev = true
		req = factory.get( '/' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect( res.body.read ).to match( /doctype html/i )
	end

	it 'redirects for shortened URLs' do
		req = factory.get( '/%s' % [short_url.short] )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::REDIRECT )
		expect( res.body.read ).to match( /^$/ )
	end

	it 'responds properly to unknown short URL hashes' do
		req = factory.get( '/bacon' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::NOT_FOUND )
		expect( res.body.read ).to match( /not found/i )
	end

end

