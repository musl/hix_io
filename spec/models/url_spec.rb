#!/usr/bin/env rspec
#
# vim: set nosta noet ts=4 sw=4 ft=rspec:
# encoding: UTF-8

require 'spec_helper'
require 'pry'

describe( HixIO::URL ) do

	before( :all ) { migrate! }
	after( :each ) { described_class.dataset.delete }

	context 'dataset methods' do

		let( :urls ) do
			10.times do |i|
				described_class.create({
					:url => 'http://example.com/%d' % [i],
					:source_ip => '127.0.0.1',
					:created_at => Time.now + i,
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

		let( :url ) do
			described_class.create({
				:url => 'http://example.com/',
				:source_ip => '127.0.0.1',
			})
		end

		it 'create short hashes' do
			expect( url.short ).to match( /^[0-9a-z]{1,7}$/ )
		end

		it 'reject invalid URLs' do
			%w[:// http:// foo].each do |u|
				url.url = u
				expect { url.save }.to raise_error( /url invalid/i )
			end

		end

		it 'will not shorten URLs that match our host' do
			url.url = 'http://%s' % [HixIO.host]
			expect { url.save }.to raise_error( /url invalid/i )
		end

	end

end

