# vim: set nosta noet ts=4 sw=4 ft=ruby:# encoding: UTF-8

require 'digest/sha2'
require 'securerandom'

# Class to describe a user account.
#
class HixIO::Metric < Sequel::Model( HixIO.table_symbol( :metrics ) )

	dataset_module do
		# TODO - create datasets for statistics.
	end

end

