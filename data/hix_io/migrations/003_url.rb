# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :urls ) do
			primary_key :id

			varchar     :short, :fixed => true, :size => 7, :nil => false, :unique => true
			text        :url, :nil => false, :unique => true
			inet        :source_ip, :nil => false, :default => IPAddr.new( '0.0.0.0' )
			integer     :hits, :nil => false, :default => 0

			timestamptz :created_at
		end
	end

	down do
		drop_table :urls
	end

end

