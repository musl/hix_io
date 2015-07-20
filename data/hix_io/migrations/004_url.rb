# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

Sequel.migration do

	up do
		create_table( :urls ) do
			varchar     :short,     :fixed => true, :size => 7, :primary_key => true
			foreign_key :user_id,   :users, :type => :text, :null => false, :on_delete => :cascade
			text        :url,       :null => false, :unique => true
			inet        :source_ip, :null => false, :default => IPAddr.new( '0.0.0.0' )
			integer     :hits,      :null => false, :default => 0
			timestamptz :ctime,     :null => false, :default => 'now()'.lit

			index :hits
			index :short
			index :ctime
		end
	end

	down do
		drop_table :urls
	end

end
