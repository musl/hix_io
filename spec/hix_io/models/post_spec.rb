#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO::Post ) do

	before( :all ) { migrate! }
	after( :all ) { migrate! }

	context 'dataset methods' do

		subject { described_class }

		let( :published ) do
			subject.create({
				:title => 'test: published',
				:body => 'rspec rocks',
				:published => true
			})
		end

		let( :unpublished ) do
			subject.create({
				:title => 'test: unpublished',
				:body => 'rspec rocks',
				:published => false
			})
		end

		it 'quickly find a published post' do
			expect( subject.detail( published.id ).first.published ).to be_true
		end

		it 'quickly find all published posts' do
			subject.published.each do |p|
				expect( p.published ).to be_true
			end
		end

		it 'provide a functioning full-text search' do
			expect( subject.search( :q => 'rspec' ).first.published ).to be_true
		end

	end

end

