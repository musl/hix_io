#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO::PhotoSet ) do

	before( :all ) { prep_db! }
	after( :all ) { prep_db! }

	let( :user ) { find_a_user }

	########################################################################
	### S P E C S
	########################################################################

	context 'dataset methods' do

		subject { described_class }

		it 'must be well tested' do
			pending 'tests'
			fail
		end

	end

	context 'instance methods' do

		subject do
			#user.add_photo_set({...})
		end

		it 'must be well tested' do
			pending 'tests'
			fail
		end

	end

end

