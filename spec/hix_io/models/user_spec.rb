#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::User ) do

	before( :all ) { prep_db! }
	after( :each ) { described_class.dataset.delete }
	after( :all ) { prep_db! }

	context 'dataset methods' do

		subject { described_class }

	end

	context 'instance methods' do

		subject do
			described_class.create({
				:email => 'tester@example.com',
				:password => Digest::SHA512.hexdigest( 'password' )
			})
		end

		it 'generate an API password before creating it' do
			expect( subject.api_secret ).to match( /^[[:xdigit:]]{128}$/i )
		end

		it 'updates its own timestamps' do
			expect( subject.ctime ).to be_a( Time )
			expect( subject.mtime ).to be_a( Time )
		end
	end

end

