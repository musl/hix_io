# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

### Use RFC8601 date strings when serializing Time objects.
###
module HixIO
	module CoreExtensions
		module JSTime
			def to_json( * )
				return self.strftime('%FT%T%z').to_json;
			end
		end
	end
end

class Time
    include HixIO::CoreExtensions::JSTime
end
