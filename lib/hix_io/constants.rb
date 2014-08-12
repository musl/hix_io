# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

# Constants for the namespace.
#
module HixIO::Constants

	# Semantic Version Number
	VERSION = '0.0.2'

	# DVCS Revision Number
	REVISION = %$Rev$

	# The data dir for the gem or in a development directory
	DATA_DIR = Pathname( __FILE__ ).parent.parent.parent + 'data/hix_io'

	# The location for migrations, in the gem or in a development directory.
	MIGRATION_DIR = DATA_DIR + 'migrations'

	# The location for models.
	MODEL_DIR = Pathname( __FILE__ ).parent + 'models'

end

