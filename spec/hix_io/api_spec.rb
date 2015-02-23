#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'hix_io/handlers/api'

describe( HixIO::API ) do

	before( :all ) { reset_db! }
	after( :all ) { reset_db! }

	subject do
		described_class.new( *TEST_APP_PARAMS )
	end

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :user ) { find_or_create_user }

	let( :url ) do
		user.add_url({
			:url => 'http://example.org/',
			:source_ip => '127.0.0.1'
		});
	end

	context 'unauthenticated requests' do

		before( :each ) do
			allow(subject.auth_provider).to receive( :authenticate ).and_return( nil )
			allow(subject.auth_provider).to receive( :authenticated_user ).and_return( nil )
		end

		it 'refuses to shorten URLs for unathenticated requests' do
			url = 'http://example.com/test'

			req = factory.post( '/urls' )
			req.content_type = 'application/x-www-form-urlencoded'
			req.body = URI.encode_www_form({ :url => url })

			res = subject.handle( req )
			res.body.rewind

			expect( res.status ).to eq( HTTP::UNAUTHORIZED )
		end

	end

	context 'authenticated requests' do

		before( :each ) do
			allow(subject.auth_provider).to receive( :authenticate ).and_return( user )
			allow(subject.auth_provider).to receive( :authenticated_user ).and_return( user )
		end

		it 'allows one to shorten a URL' do
			url = 'http://example.com/test'

			req = factory.post( '/urls' )
			req.content_type = 'application/x-www-form-urlencoded'
			req.body = URI.encode_www_form({ :url => url })

			res = subject.handle( req )
			res.body.rewind

			expect( res.status ).to eq( HTTP::OK )
			expect {
				obj = JSON.parse( res.body.read )
				expect( obj['short'] ).to match( /[0-9a-z]{7}/ )
				expect( obj['url'] ).to eq( url )
			}.not_to raise_error
		end

		it 'refuses to shorten an invalid URL' do
			req = factory.post( '/urls' )

			req.content_type = 'application/x-www-form-urlencoded'
			req.body = URI.encode_www_form({ :url => 'flerp? blfoop!' })

			res = subject.handle( req )

			expect( res.status ).to eq( HTTP::UNPROCESSABLE_ENTITY )
		end

	end

end

