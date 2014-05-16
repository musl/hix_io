# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :photos ) do
			primary_key :id

			foreign_key :photo_set_id, :photo_sets, :null => false, :on_delete => :cascade

			text :path, :null => false
			timestamptz :ctime, :null => false, :default => 'now()'.lit

			index :ctime
		end
	end

	down do
		drop_table :photos
	end

end
