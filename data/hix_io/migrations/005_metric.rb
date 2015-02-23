# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8
#
Sequel.migration do

	up do
		create_table( :metrics ) do
			primary_key :id
			json        :data
			timestamptz :ctime, :index => true
		end
	end

	down do
		drop_table :metrics
	end

end
