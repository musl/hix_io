# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8
Sequel.migration do

	up do
		drop_function( :update_mtime, :if_exists => true )
		create_function(
			:update_mtime,
			%q{
				BEGIN
					NEW.mtime = CURRENT_TIMESTAMP;
					RETURN NEW;
				END;
			}.gsub(/^\t{4}/, ''),
			:language => 'plpgsql',
			:returns  => 'trigger'
		)
	end

	down do
		drop_function( :update_mtime )
	end

end
