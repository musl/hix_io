#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
load HixIO::DATA_DIR + 'apps/api'

describe( HixIO::API ) do

	before( :all ) { migrate! }

	subject do
		described_class.new( *TEST_APP_PARAMS )
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

	let( :post ) do
		user.add_post({
			:title => 'RSPEC ROCKS',
			:body => 'Yes, it certainly does.',
			:published => true
		})
	end

	let( :url ) do
		user.add_url({
			:url => 'http://example.org/',
			:source_ip => '127.0.0.1'
		});
	end

	it 'provides a list of posts' do
		req = factory.get( '/posts' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect( res.content_type ).to eq( 'application/json' )
		expect {
			JSON.parse( res.body.read )
		}.not_to raise_error
	end

	it 'provides a detail on a post' do
		req = factory.get( '/posts/%d' % [post.id] )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect( res.content_type ).to eq( 'application/json' )
		expect {
			obj = JSON.parse( res.body.read )
			expect( obj['title'] ).to eq( post.title )
		}.not_to raise_error
	end

	it 'provides a post search' do
		req = factory.get( '/search' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect( res.content_type ).to eq( 'application/json' )
		expect {
			JSON.parse( res.body.read )
		}.not_to raise_error
	end

	it 'provides lists of top and latest shortened URLs' do
		req = factory.get( '/urls' )

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect {
			obj = JSON.parse( res.body.read )
			expect( obj['top_urls'] ).to be_a( Array )
			expect( obj['latest_urls'] ).to be_a( Array )
		}.not_to raise_error
	end

	it 'allows one to shorten a URL' do
		req = factory.post( '/urls' )
		req.content_type = 'application/x-www-form-urlencoded'
		req.body = 'url=http%3A%2F%2Fexample.com%2Ftest'

		res = subject.handle( req )
		res.body.rewind

		expect( res.status ).to eq( HTTP::OK )
		expect {
			obj = JSON.parse( res.body.read )
			expect( obj['short'] ).to match( /[0-9a-f]{1,7}/ )
			expect( obj['url'] ).to eq( 'http://example.com/test' )
		}.not_to raise_error
	end

	it 'refuses to shorten an invalid URL' do
		req = factory.post( '/urls' )
		req.content_type = 'application/x-www-form-urlencoded'
		req.body = 'url=crap'

		res = subject.handle( req )

		expect( res.status ).to eq( HTTP::UNPROCESSABLE_ENTITY )
	end

end

