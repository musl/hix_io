
#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'hix_io/handlers/auth'

describe( HixIO::Auth ) do

	before( :all ) do
		prep_db!
		Strelka::App::Auth.configure( HixIO.global_config.auth )
	end

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :user ) do
		HixIO::User.find_or_create( :email => 'test@example.com' ) do |user|
			user.password = Digest::SHA512.hexdigest( 'test' )
			user.disable_on = Time.now() + 86400
		end
	end

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

	context 'authenticated requests'do

		before( :each ) do
			subject.auth_provider.stub( :authenticate ).and_return( user )
			subject.auth_provider.stub( :authenticated_user ).and_return( user )
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
