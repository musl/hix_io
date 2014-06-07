# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :posts ) do
			primary_key :id

			foreign_key :user_id, :users, :null => false, :on_delete => :cascade
			String      :title, :null => false

			String      :body, :null => false
			boolean     :published, :null => false, :default => false

			timestamptz :ctime, :null => false, :default => 'now()'.lit
			timestamptz :mtime, :null => false, :default => 'now()'.lit

			index :ctime
			index :mtime
			index :user_id

			full_text_index [:title, :body], :language => 'english'
		end

		create_trigger(
			:posts,
			:posts_mtime_trigger,
			:update_mtime,
			:events => :update,
			:each_row => true,
		)
	end

	down do
		drop_trigger :posts, :posts_mtime_trigger
		drop_table :posts
	end

end
