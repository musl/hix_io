# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8
#
Sequel.migration do

	up do
		create_table( :users ) do
			text        :email,      :primary_key => true, :index => true
			text        :name,       :null => false
			text        :password,   :null => false, :length => 128
			text        :api_secret, :null => false
			timestamptz	:ctime,      :null => false, :default => 'now()'.lit
			timestamptz	:mtime,      :null => false, :default => 'now()'.lit
		end
	end

	down do
		drop_table :users
	end

end
