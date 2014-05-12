# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

module HixIO

	# A namespace for modules that extend or modify other libraries.
	#
	module CoreExtensions

		# Use RFC8601 date strings when serializing Time objects.
		#
		module JSTime
			def to_json( * ) #:nodoc:
				return self.strftime('%FT%T%z').to_json;
			end
		end

	end
end

class Time #:nodoc:
    include HixIO::CoreExtensions::JSTime
end
