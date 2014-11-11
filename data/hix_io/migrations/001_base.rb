# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8
#
# Notes on dev DB setup stuck here for a moment:
#	create role hix_io with login;
#	alter role hix_io set search_path to hix_io;
#	create database hix_io_dev owner hix_io;
#	grant all on database hix_io_dev to hix_io;
#	\c hix_io_dev;
#	create schema hix_io authorization hix_io;
#	grant all on schema hix_io to hix_io;
#
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
