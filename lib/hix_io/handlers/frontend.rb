# vim: set nosta noet ts=4 sw=4 ft=ruby:
# encoding: UTF-8

require 'strelka'
require 'hix_io'

# Provides routes for the application's templates and non-api resources.
#
class HixIO::Frontend < Strelka::App

	extend Loggability
	log_to :hix_io

	plugins \
		:routing,
		:parameters,
		:templating

	default_type 'text/html'

	templates :index => 'index.tmpl'

	param :short, /[a-z0-9]{1,7}/

	########################################################################
	### R O U T E S
	########################################################################

	get '/' do |req|
		tmpl = template( :index )
		tmpl.meta = self.meta( req )
		return tmpl
	end

	get '/:short' do |req|
		if url = HixIO::URL[:short => req.params[:short]]
			url.update( :hits => url.hits + 1 )
			finish_with( HTTP::REDIRECT, '', :location => url.url )
		end

		finish_with( HTTP::NOT_FOUND )
	end

	########################################################################
	### I N S T A N C E   M E T H O D S
	########################################################################

	# Provide metadata to ship along with the response for +req+.
	#
	def meta( req )
		meta = {
			:host => HixIO.host,
			:stamp => Time.now,
			:dev => HixIO.dev?,
			:ssl => req.ssl?,
			:scheme => req.scheme,
		}

		if HixIO.dev?
			meta[:req] = {
				:env => ENV.to_hash,
				:headers => req.headers.to_hash
			}
			return JSON.pretty_generate( meta )
		end

		return meta.to_json
	end

end

