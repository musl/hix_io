# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :photo_sets ) do
			primary_key :id

			foreign_key :user_id, :users, :type => :text, :null => false, :on_delete => :cascade

			text :title, :null => false
			timestamptz :ctime, :null => false, :default => 'now()'.lit

			index :ctime
		end
	end

	down do
		drop_table :photo_sets
	end

end
