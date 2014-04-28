#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'strelka/authprovider/hixio'

describe( Strelka::AuthProvider::HixIO ) do

	before( :all ) { migrate! }

	subject { described_class.new( nil ) }

	let( :factory ) { Mongrel2::RequestFactory.new( :route => '/' ) }

	let( :user ) do
		HixIO::User.find_or_create( :email => 'test@example.com' ) do |user|
			user.password = Digest::SHA512.hexdigest( 'test' )
			user.disable_on = Time.now() + 86400
		end
	end

	let( :req ) { factory.post( '/' ) }

	it 'accept vaild sessions' do
		subject.make_session( user, req )
		expect( subject.authenticate( req ) ).to eq( user )
	end

	it 'accept valid login attempts' do
		req.content_type = 'application/x-www-form-encoded'
		req.body = URI.encode_www_form( {
			:email => user.email,
			:password => user.password
		} )

		expect( subject.authenticate( req ) ).to eq( user )
	end

	it 'reject login attempts with invalid user acconts' do
		req.content_type = 'application/x-www-form-encoded'
		req.body = URI.encode_www_form( {
			:email => 'spock',
			:password => 'evil goatee'
		} )

		subject.should_receive( :require_authentication )
		expect( subject.authenticate( req ) ).to be_nil
	end

	it 'reject login attempts with invalid passwords' do
		req.content_type = 'application/x-www-form-encoded'
		req.body = URI.encode_www_form( {
			:email => user.email,
			:password => 'flerp? blfoop!'
		} )

		subject.should_receive( :require_authentication )
		expect( subject.authenticate( req ) ).to be_nil
	end

	it 'should authorize all requests' do
		expect( subject.authorize( nil, req, nil ) ).to be_true
	end

end
