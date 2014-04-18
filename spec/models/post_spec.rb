#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO::Post ) do

	context 'dataset methods' do

		subject { described_class }

		let( :published ) {
			subject.new({
				:title => 'test: published',
				:body => 'rspec rocks',
				:published => true
			})
		}

		let( :unpublished ) {
			subject.new({
				:title => 'test: unpublished',
				:body => 'rspec rocks',
				:published => false
			})
		}

		it 'quickly finds a published post' do
			pending 'WRITE ME'
		end

		it 'quickly finds all published posts' do
			pending 'WRITE ME'
		end

		it 'provides a functioning full-text search' do
			pending 'WRITE ME'
		end

	end

end

