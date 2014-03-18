# vim: set nosta noet ts=4 sw=4:

$LOAD_PATH << 'lib' unless $LOAD_PATH.include? 'lib'

begin
	require 'hix_io'
rescue LoadError => e
	$stderr.puts "Yarg!\n%s\n%s" % [e.message, e.backtrace]
end

Pry.config.hooks.add_hook(:before_session, :set_context) do |_,_,pry|
	pry.input = StringIO.new("cd HixIO")
end

