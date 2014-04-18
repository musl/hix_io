#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO::Post ) do

	before( :all ) do
		migrate!
	end

	context 'dataset methods' do

		subject { described_class }

		let( :published ) {
			subject.create({
				:title => 'test: published',
				:body => 'rspec rocks',
				:published => true
			})
			require 'pry'; binding.pry
		}

		let( :unpublished ) {
			subject.create({
				:title => 'test: unpublished',
				:body => 'rspec rocks',
				:published => false
			})
		}

		it 'quickly finds a published post' do
			expect( subject.detail( published.id ).first ).to eq( published )
		end

		it 'quickly finds all published posts' do
			expect( subject.published.all ).to include( published )
			expect( subject.published.all ).not_to include( unpublished )
		end

		it 'provides a functioning full-text search' do
			expect( subject.search( :q => 'rspec' ).first ).to eq( published )
		end

	end

end

