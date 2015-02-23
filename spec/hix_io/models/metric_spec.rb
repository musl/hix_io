#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::Metric ) do

	before( :all ) do
		reset_db!
		user = find_or_create_user

		# TODO create metrics
	end

	after( :all ) { reset_db! }

	context 'dataset methods' do

		subject { described_class }

	end

	context 'instance methods' do

		subject { descirbed_class.first }

	end

end

