#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'strelka/authprovider/hix_io'

describe( Strelka::AuthProvider::HixIO ) do

	subject do
		described_class.allowed_netblocks = %w[127.0.0.1/32]
		described_class.new( nil )
	end

	let( :factory ) do
		Mongrel2::RequestFactory.new( :route => '/' )
	end

	it 'authorizes addresses in its configured netblocks' do
		req = factory.get( '/' )
		req.header['x_forwarded_for'] = '127.0.0.1'

		expect( subject.authorize( nil, req, nil ) ).to be_true
	end

	it 'responds properly to unauthorized requests' do
		req = factory.get( '/' )
		req.header['x_forwarded_for'] = '127.0.0.2'

		expect { subject.authorize( nil, req, nil ) }.to raise_error
	end

	it 'authenticates requests' do
		expect( subject.authenticate( nil ) ).to be_true
	end

end

