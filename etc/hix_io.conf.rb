
data_dir   = Pathname( Gem.datadir( 'hix_io' ) || 'data/hix_io' ).expand_path
static_dir = data_dir.relative_path_from( Pathname('/') ) + 'static/'

server 'main' do

    name         'HixIO App Server'
    chroot       '/'
    access_log   '/var/log/mongrel2/access.log'
    error_log    '/var/log/mongrel2/error.log'
    pid_file     '/var/run/mongrel2_www.pid'
    bind_addr    '127.0.0.1'
    port         8080
    default_host 'main'

    host 'main' do
		route '/',        handler( 'tcp://127.0.0.1:61381', 'hixio-frontend' )
		route '/api/v1/', handler( 'tcp://127.0.0.1:61383', 'hixio-api' )
		route '/auth/',   handler( 'tcp://127.0.0.1:61385', 'hixio-auth' )
		route '/static/', directory( static_dir )
		route '/misc/', directory( 'usr/local/hix.io/www/' )
    end

end

settings 'control_port'          => 'ipc://m2control',
         'server.daemonize'      => false,
         'limits.content_length' => '524288',
         'upload.temp_store'     => '/tmp/mongrel2.upload.XXXXXXX',
         'zeromq.threads'        => 1

