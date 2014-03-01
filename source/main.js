
var time = Date.now();

module

	.require( "libs/lib.foobar" )
	.require( "libs/lib.event" )

	.require( "bar/bar" )
	.require( "foo/foo" )

	.define = function ( foobar, event, bar, foo ) {

		time = Date.now() - time;
		console.log( time + "ms to load" );

	};