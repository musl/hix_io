#!/usr/bin/env rspec
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'

describe( HixIO::Post ) do

	before( :all ) { migrate! }

	let( :user ) do
		HixIO::User.find_or_create( :email => 'test@example.com' ) do |user|
			user.password = Digest::SHA512.hexdigest( 'test' )
			user.disable_on = Time.now() + 86400
		end
	end

	########################################################################
	### S P E C S
	########################################################################

	context 'dataset methods' do

		subject { described_class }

		let( :published ) do
			user.add_post({
				:user_id => user.id,
				:title => 'test: published',
				:body => 'rspec rocks',
				:published => true
			})
		end

		let( :unpublished ) do
			user.add_post({
				:user_id => user.id,
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

	context 'instance methods' do

		subject do
			user.add_post({
				:user_id => user.id,
				:title => 'test',
				:body => 'rspec rocks',
				:published => true
			})
		end

		it 'updates its own timestamps' do
			expect( subject.ctime ).to be_a( Time )
			expect( subject.mtime ).to be_a( Time )
		end

	end

end

