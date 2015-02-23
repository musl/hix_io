# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8
#
Sequel.migration do

	up do
		create_table :sessions do
			text        :session_id, :primary_key => true, :index => true
			text        :session
			timestamptz :created
		end
	end

	down do
		drop_table :sessions
	end

end
