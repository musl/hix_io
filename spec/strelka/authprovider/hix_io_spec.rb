#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'strelka/authprovider/hixio'


describe( Strelka::AuthProvider::HixIO ) do

	before( :all ) { reset_db! }
	after( :all ) { reset_db! }

	subject { described_class.new( nil ) }

	let( :user ) { find_or_create_user }

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	let( :req ) { factory.post( '/auth' ) }

	it 'should authorize all requests' do
		expect( subject.authorize( nil, nil, nil ) ).to eq true
	end

	it 'should reject unauthenticated requests' do
		expect{ subject.authenticate( req ) }.to throw_symbol :finish
	end

	it 'should accept valid sessions' do
		subject.make_session( user, req )
		expect( subject.authenticate( req ) ).to eq( user )
	end

	it 'should reject invalid sessions' do
		subject.make_session( user, req )
		req.session[:src_ip] = 'nope'
		expect{ subject.authenticate( req ) }.to throw_symbol :finish
	end

	it 'should accept valid login attempts' do
		req.body = URI.encode_www_form( { :email => user.email, :password => user.password } )
		expect( subject.authenticate( req ) ).to eq( user )
	end

	it 'should reject invalid login attempts' do
		req.body = URI.encode_www_form( {} )
		expect{ subject.authenticate( req ) }.to throw_symbol :finish

		req.body = URI.encode_www_form( { :email => 'joe@hacker.us' } )
		expect{ subject.authenticate( req ) }.to throw_symbol :finish

		req.body = URI.encode_www_form( { :email => 'joe@hacker.us', :password => '123456' } )
		expect{ subject.authenticate( req ) }.to throw_symbol :finish
	end

end