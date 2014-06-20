#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::URL ) do

	before( :all ) { prep_db! }
	after( :each ) { described_class.dataset.delete }
	after( :all ) { prep_db! }

	let( :user ) { find_a_user }

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
			expect( urls.top.all.length ).to eq( 10 )
		end

		it 'quickly find the latest URLs' do
			expect( urls.latest.all.length ).to eq( 10 )
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

