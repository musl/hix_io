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

	it 'is tested' do
		pending 'a feature list'
	end

end

