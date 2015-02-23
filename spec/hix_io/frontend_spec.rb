#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'hix_io/handlers/frontend'

describe( HixIO::Frontend ) do

	before( :all ) { reset_db! }
	after( :all ) { reset_db! }

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :user ) { find_or_create_user }

	let( :short_url ) do
		user.add_url({
			:url => 'http://example.com',
			:source_ip => '127.0.0.1'
		})
	end

	subject { described_class.new( *TEST_APP_PARAMS ) }

	it 'rejects unknown methods' do
		req = factory.put( '/' )
		req.content_type = 'application/x-www-form-encoded'
		req.body = 'wh=aaaaaat'

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::METHOD_NOT_ALLOWED )
		expect( res.body.read ).to match( /method not allowed/i )
	end

	it 'serves the main application when not in dev mode' do
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

	it 'yields the proper status when given an unknown shortened URL' do
		req = factory.get( '/deadbee' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::NOT_FOUND )
	end

end

