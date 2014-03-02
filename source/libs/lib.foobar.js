
module.require( "foobar/foobar_foo", "foobar/foobar_bar" ).define = function ( foo, bar ) {

	return {
		"Foo": foo,
		"Bar": bar
	};

}