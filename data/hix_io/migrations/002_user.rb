# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :users ) do
			String      :email, :primary_key => true, :size => 255

			# Form Auth, SHA512 hashed user supplied string
			String      :password, :null => false, :size => 128

			# API Auth, SHA512 hashed random bytes
			String      :api_secret, :null => false, :size => 128

			json        :perms, :null => false, :default => "'{}'::json".lit
			json        :attributes, :null => false, :default => "'{}'::json".lit

			timestamptz :disable_on, :default => nil

			timestamptz :ctime, :null => false, :default => 'now()'.lit
			timestamptz :mtime, :null => false, :default => 'now()'.lit

			index :ctime
			index :email
			index :mtime
		end

		create_trigger(
			:users,
			:users_mtime_trigger,
			:update_mtime,
			:events => :update,
			:each_row => true,
		)
	end

	down do
		drop_trigger :users, :users_mtime_trigger
		drop_table :users
	end

end
