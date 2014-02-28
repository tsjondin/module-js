
module

	.require( "libs/lib.foobar" )
	.require( "libs/lib.event" )

	.require( "bar/bar" )
	.require( "foo/foo" )

	.define( function ( foobar, event, bar, foo ) {

		console.log( foobar, event, bar, foo );

});