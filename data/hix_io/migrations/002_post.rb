# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :posts ) do
			primary_key   :id

			String        :title, :nil => false
			String        :body, :nil => false

			timestamptz   :created_at
			timestamptz   :updated_at
		end
	end

	down do
		drop_table :posts
	end

end

