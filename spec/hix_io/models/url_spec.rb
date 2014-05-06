#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::URL ) do

	before( :all ) { prep_db! }
	after( :each ) { described_class.dataset.delete }

	let( :user ) do
		HixIO::User.find_or_create( :email => 'test@example.com' ) do |user|
			user.password = Digest::SHA512.hexdigest( 'test' )
			user.disable_on = Time.now() + 86400
		end
	end

	context 'dataset methods' do

		subject { described_class }

		let( :urls ) do
			10.times do |i|
				user.add_url({
					:url => 'http://example.com/%d' % [i],
					:source_ip => '127.0.0.1',
					:ctime => Time.now + i,
					:hits => i
				})
			end
			described_class
		end

		it 'quickly find the top URLs' do
			expect( urls.top.all ).to have( 10 ).things
		end

		it 'quickly find the latest URLs' do
			expect( urls.latest.all ).to have( 10 ).things
		end

	end

	context 'instance methods' do

		subject do
			user.add_url({
				:url => 'http://example.com/',
				:source_ip => '127.0.0.1',
			})
		end

		it 'create short hashes' do
			expect( subject.short ).to match( /^[0-9a-z]{1,7}$/ )
		end

		it 'reject invalid URLs' do
			%w[:// http:// foo].each do |u|
				subject.url = u
				expect { subject.save }.to raise_error( /url invalid/i )
			end

		end

		it 'will not shorten URLs that match our host' do
			subject.url = 'http://%s' % [HixIO.host]
			expect { subject.save }.to raise_error( /url invalid/i )
		end

		it 'updates its own timestamps' do
			expect( subject.ctime ).to be_a( Time )
		end

	end

end

