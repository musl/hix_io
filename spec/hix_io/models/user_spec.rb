#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::User ) do

	before( :all ) { reset_db! }
	after( :all ) { reset_db! }

	context 'dataset methods' do

		subject { described_class }

	end

	context 'instance methods' do

		subject { find_or_create_user }

		it 'generate an API password before creating it' do
			expect( subject.api_secret ).to match( /^[[:xdigit:]]{128}$/i )
		end

		it 'updates its own timestamps' do
			expect( subject.ctime ).to be_a( Time )
			expect( subject.mtime ).to be_a( Time )
			expect( subject.mtime ).to be >= subject.ctime
		end

		it 'hides secrets when serializing a user' do
			expect( JSON.parse( subject.to_json ).keys ).to_not include( %w[password api_secret] )
		end
	end

end

