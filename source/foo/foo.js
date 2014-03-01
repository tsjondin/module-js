
module.define = function ( ) {

	var prototype = {};

	prototype.hello = "Hello";
	prototype.world = "World";

	return function Foo () {

		var o = Object.create( prototype );
		return o;

	};

};