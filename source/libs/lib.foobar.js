
module

	.require( "foobar/foobar_foo" )
	.require( "foobar/foobar_bar" )

	.define( function ( foo, bar ) {

		return {
			"Foo": foo,
			"Bar": bar
		};

} )