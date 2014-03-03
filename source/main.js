
module.require( "libs/lib.foobar", "libs/lib.event", "bar/bar", "foo/foo" )
.define = function ( foobar, event, bar, foo ) {
	console.log( foobar );
};