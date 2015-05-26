
#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'hix_io/handlers/auth'

describe( HixIO::Auth ) do

	before( :all ) do
		reset_db!
		Strelka::App::Auth.configure( HixIO.global_config.auth )
	end

	after( :all ) { reset_db! }

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :user ) { find_or_create_user }

	subject do
		described_class.new( *TEST_APP_PARAMS )
	end

	it 'allows a user to sign in' do
		req = factory.post( '/' )

		req.content_type = 'application/x-www-form-encoded'
		req.body = URI.encode_www_form( {
			:email => user.email,
			:password => user.password,
		} )

		res = subject.handle( req )
		res.body.rewind

		returned_user = JSON.parse( res.body.read )

		expect( res.status ).to eq( HTTP::OK )
		expect( returned_user['email'] ).to eq( user.email )
		expect( res.session.id ).not_to be_nil
	end

	it 'denies login attempts with an incorrect password' do
		req = factory.post( '/' )

		req.content_type = 'application/x-www-form-encoded'
		req.body = URI.encode_www_form( {
			:email => user.email,
			:password => 'flaming hot monkey balls'
		} )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::UNAUTHORIZED )
	end

	context 'authenticated requests' do

		before( :each ) do
			allow(subject.auth_provider).to receive( :authenticate ).and_return( user )
			allow(subject.auth_provider).to receive( :authenticated_user ).and_return( user )
		end

		it 'provides the authenticated user' do
			req = factory.get( '/' )

			req.content_type = 'application/json'

			res = subject.handle( req )
			res.body.rewind

			returned_user = JSON.parse( res.body.read )

			expect( res.status ).to eq( HTTP::OK )
			expect( returned_user['email'] ).to eq( user.email )
		end

		it 'allows a user to sign out' do
			req = factory.delete( '/' )
			req.content_type = 'text/html'

			subject.auth_provider.make_session( user, req )

			res = subject.handle( req )
			res.body.rewind

			#expect( res.status ).to eq( HTTP::NO_CONTENT )
			expect( res.status ).to eq( HTTP::OK )
			expect( res.body.read ).to eq( ''.to_json )
		end

	end

end
