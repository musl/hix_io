#!/usr/bin/env rake
# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'rake'
require 'rake/clean'
require 'pathname'

BASEDIR = Pathname.new( __FILE__ ).expand_path.dirname.relative_path_from( Pathname.getwd )
LIBDIR  = BASEDIR + 'lib'
DATADIR = BASEDIR + 'data/hix_io'
DOCSDIR = DATADIR + 'static/docs'

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

task :default => [ :clobber, :docs, :coverage, :test_user ]

########################################################################
### P A C K A G I N G
########################################################################

begin
	require 'rubygems'
	require 'rubygems/package_task'

	spec = Gem::Specification.new do |s|
		s.description           = 'hix_io - a gem for my website'
		s.homepage              = 'http:/hix.io/'
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
		s.executables           = %w[hix_io_configure hix_io_migrate hix_io_run]

		s.add_dependency 'strelka', '~> 0.9'
		s.add_dependency 'inversion', '~> 0.12'
		s.add_dependency 'sequel', '~> 4.13'
		s.add_dependency 'pg', '~> 0.18'
		s.add_dependency 'loggability', '~> 0.11'
		s.add_dependency 'trollop', '~> 2.0'

		s.add_development_dependency 'pry', '~> 0.10'
		s.add_development_dependency 'rdoc', '~> 4.1'
		s.add_development_dependency 'rdoc-generator-fivefish', '~> 0.1'
		s.add_development_dependency 'rspec', '~> 3.0'
		s.add_development_dependency 'ruby-prof', '~> 0.15'
		s.add_development_dependency 'simplecov', '~> 0.8'
		s.add_development_dependency 'htty', '~> 1.5'
		s.add_development_dependency 'foreman', '~> 0.75'
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

	desc "Hack to deploy the gem to production."
	task :deploy => [:repackage] do
		gem_path = Pathname.new( "pkg/#{spec.name}-#{spec.version}.gem" ).expand_path
		system "scp #{gem_path} root@hix.io:"
		system "ssh root@hix.io '" +
			"gem uninstall hix_io &&" +
			"gem install #{gem_path.basename} &&" +
			"svc -t /service/hix_io* &&" +
			"cp /usr/local/lib/ruby/gems/2.1/gems/#{gem_path.basename.sub(/\.gem$/, '')}/etc/hix_io.conf.rb /usr/local/etc/hix.io/hix_io.conf.rb &&" +
			"hix_io_configure &&" +
			"svc -t /service/*mongrel2 &&" +
			"sleep 5 &&" +
			"svstat /service/*" +
			"'"
	end

	desc "Create a source-able environment file for development"
	task :devenv do
		newlibpath = LIBDIR.realpath
		newlibpath += ':' + ENV['RUBYLIB'] if ENV['RUBYLIB']

		env = BASEDIR + '.env'
		env.open( 'w' ) do |f|
			case ENV['SHELL']
			when /csh$/
				f.puts "setenv RUBYLIB %s" % [ newlibpath ]
			else
				f.puts "export RUBYLIB=%s" % [ newlibpath ]
			end
		end

		$stderr.puts "Source #{env.realpath} from your shell."
	end

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
				--predef HixIO
				--predef moment
				--predef CryptoJS
				--unparam
				--white
			],
				Pathname.glob( DATADIR + 'static/js/*.js' )
		]

		system cmd.flatten.join( ' ' )
	end
end

begin
	desc 'Create a tester user.'
	task :test_user do
		HixIO.load_config
		return unless HixIO.dev?
		HixIO::User.find_or_create( :email => 'a@b.c' ) { |new_user|
			new_user.name = 'Tester McTester'
			new_user.password = 'a'
		}
	end
end

########################################################################
### D O C U M E N T A T I O N
########################################################################

begin require 'rdoc/task'

	desc 'Generate rdoc documentation'
	RDoc::Task.new do |rdoc|
		rdoc.name       = :docs
		rdoc.rdoc_dir   = DOCSDIR.to_s
		rdoc.title      = "hix_io - #{HixIO::VERSION} - Developer Documentation"
		rdoc.generator  = 'fivefish'
		rdoc.main       = "README.rdoc"
		rdoc.rdoc_files = [ 'lib', *FileList['*.rdoc'] ]
	end

	desc 'Generate rdoc coverage information'
	RDoc::Task.new do |rdoc|
		rdoc.name       = :docs_coverage
		rdoc.rdoc_dir   = (DOCSDIR + 'coverage').to_s
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
bin/hix_io_run
etc/config.yml
etc/hix_io.conf.rb
lib/hix_io/constants.rb
lib/hix_io/core_extensions.rb
lib/hix_io/handlers/api.rb
lib/hix_io/handlers/auth.rb
lib/hix_io/handlers/frontend.rb
lib/hix_io/models/url.rb
lib/hix_io/models/user.rb
lib/hix_io.rb
lib/strelka/authprovider/hixio.rb
data/hix_io/migrations/001_base.rb
data/hix_io/migrations/002_session.rb
data/hix_io/migrations/003_user.rb
data/hix_io/migrations/004_url.rb
data/hix_io/static/css/grids-responsive-min.css
data/hix_io/static/css/grids-responsive-old-ie-min.css
data/hix_io/static/css/pure-min.css
data/hix_io/static/css/style.css
data/hix_io/static/images/knot_3_wolves.jpg
data/hix_io/static/js/hix_io.js
data/hix_io/static/js/index.js
data/hix_io/static/js/lib/can.min.js
data/hix_io/static/js/lib/jquery.cookie.js
data/hix_io/static/js/lib/jquery.min.js
data/hix_io/static/js/lib/moment.min.js
data/hix_io/static/js/lib/sha512.js
data/hix_io/static/templates/home.stache
data/hix_io/static/templates/menu.stache
data/hix_io/static/templates/urls.stache
data/hix_io/static/templates/user.stache
data/hix_io/static/templates/message_box.stache
data/hix_io/templates/index.tmpl
data/hix_io/templates/layout.tmpl
