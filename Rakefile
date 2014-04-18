#!/usr/bin/env rake
# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'rake'
require 'rake/clean'
require 'pathname'

BASEDIR = Pathname.new( __FILE__ ).expand_path.dirname.relative_path_from( Pathname.getwd )
LIBDIR  = BASEDIR + 'lib'
DATADIR = BASEDIR + 'data/hix_io'

$LOAD_PATH.unshift( LIBDIR.to_s )

require 'hix_io'

Encoding.default_internal = 'utf-8'
Encoding.default_external = 'utf-8'

Rake.verbose( false )
if Rake.application.options.trace
    $trace = true
    $stderr.puts '$trace is enabled'
end

MANIFEST = File.read( __FILE__ ).split( /^__END__/, 2 ).last.split

task :default => [ :docs, :coverage ]

########################################################################
### P A C K A G I N G
########################################################################

begin
	require 'rubygems'
	require 'rubygems/package_task'

	spec = Gem::Specification.new do |s|
		s.description           = 'hix_io - a gem for my website'
		s.homepage              = 'http://hix.io/'
		s.email                 = 'm@hix.io'
		s.authors               = [ 'Mike Hix <m@hix.io>' ]
		s.platform              = Gem::Platform::RUBY
		s.summary               = 'A gem for my website.'
		s.name                  = 'hix_io'
		s.version               = HixIO::VERSION
		s.license               = 'BSD'
		s.has_rdoc              = false
		s.require_path          = 'lib'
		s.files                 = MANIFEST
		s.required_ruby_version = '>= 2.0.0'
		s.executables           = %w[hix_io_migrate hix_io_configure]

		s.add_dependency 'strelka', '~> 0.8'
		s.add_dependency 'inversion', '~> 0.12'
		s.add_dependency 'sequel', '~> 4.7'
		s.add_dependency 'pg', '~> 1.17'
		s.add_dependency 'loggability', '~> 0.10'
		s.add_dependency 'trollop', '~> 2.0'

		s.add_development_dependency 'pry', '~> 0.9'
		s.add_development_dependency 'rdoc', '>= 4.1'
		s.add_development_dependency 'rdoc-generator-fivefish', '>= 0.1'
		s.add_development_dependency 'rspec', '~> 2.14'
		s.add_development_dependency 'ruby-prof', '~> 0.14'
		s.add_development_dependency 'simplecov', '~> 0.8'
		s.add_development_dependency 'execjs', '~> 2.0'
	end

	Gem::PackageTask.new( spec ).define

	desc "Install the gem."
	task :install => [:package] do |t|
		require 'rubygems/commands/install_command'
		cmd = Gem::Commands::InstallCommand.new
		gem_path = Pathname.new( "pkg/#{spec.name}-#{spec.version}.gem" ).expand_path.to_s
		cmd.handle_options ['--no-ri', '--no-rdoc', gem_path ]
		cmd.execute
	end

	desc "Uninstall the gem."
	task :uninstall do |t|
		require 'rubygems/commands/uninstall_command'
		cmd = Gem::Commands::UninstallCommand.new
		cmd.handle_options ['-a', '-x', '-I', spec.name ]
		cmd.execute
	end

	desc "Rebuild and reinstall the gem."
	task :reinstall => [:repackage, :uninstall, :install]

rescue LoadError
	$stderr.puts "Omitting packaging tasks, rubygems doesn't seem to be installed?"
end

########################################################################
### T E S T I N G
########################################################################

begin
	require 'rspec/core/rake_task'
	task :test => :spec

	desc "Run specs"
	RSpec::Core::RakeTask.new do |t|
		t.pattern = "spec/**/*_spec.rb"
	end

	### Code coverage, using SimpleCov
	###
	desc "Build a coverage report"
	task :coverage do
		ENV['COVERAGE'] = 'yep'
		Rake::Task[:spec].invoke
	end

rescue LoadError
	$stderr.puts "Omitting testing tasks, rspec doesn't seem to be installed."
end

# Use JSLint to check the JavaScript application, for great justice. Try to
# install JSLint if it's not installed in this project.
#
begin
	desc 'Lint the JavaScript application.'
	task :jslint do

		# Check for jslint's node wrapper.
		jslint = BASEDIR + 'node_modules/.bin/jslint'

		# Install the module if the wrapper's not there.
		system 'npm install jslint' unless jslint.exist?

		cmd = [
			jslint,
			%w[
				--browser
				--predef $
				--predef can
				--predef hljs
				--unparam
				--white
			],
			Pathname.glob( DATADIR + 'static/js/*.js' )
		]

		system cmd.flatten.join( ' ' )
	end
end

########################################################################
### D O C U M E N T A T I O N
########################################################################

begin require 'rdoc/task'

	desc 'Generate rdoc documentation'
	RDoc::Task.new do |rdoc|
		rdoc.name       = :docs
		rdoc.rdoc_dir   = 'data/hix_io/static/docs'
		rdoc.title      = "hix_io - #{HixIO::VERSION} - Developer Documentation"
		rdoc.generator  = 'fivefish'
		rdoc.main       = "README.rdoc"
		rdoc.rdoc_files = [ 'lib', *FileList['*.rdoc'] ]
	end

	desc 'Generate rdoc coverage information'
	RDoc::Task.new do |rdoc|
		rdoc.name       = :docs_coverage
		rdoc.rdoc_dir   = 'data/hix_io/docs/coverage'
		rdoc.options    = [ '-C1' ]
		rdoc.rdoc_files = [ 'lib', *FileList['*.rdoc'] ]
	end

rescue LoadError
	$stderr.puts "Omitting 'docs' tasks, rdoc doesn't seem to be installed."
end

########################################################################
### M A N I F E S T
########################################################################

__END__
LICENSE
README.rdoc
bin/hix_io_configure
bin/hix_io_migrate
data/hix_io/apps/api
data/hix_io/migrations/001_base.rb
data/hix_io/migrations/002_post.rb
data/hix_io/static/css/reset.css
data/hix_io/static/css/style.css
data/hix_io/static/index.html
data/hix_io/static/js/can.js
data/hix_io/static/js/jquery.min.js
data/hix_io/static/js/main.js
data/hix_io/static/templates/posts.ejs
lib/hix_io.rb
lib/hix_io/constants.rb
lib/hix_io/models/post.rb
spec/hix_io_spec.rb
spec/models/post_spec.rb
spec/spec_helper.rb
