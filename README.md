module.js
=========

JavaScript client-side modularization

Supported browsers:

 - Microsoft Internet Explorer 9+
 - FireFox 4+
 - Chrome 5+

The limited support is due to the following; You should not be using this in a production
environment - optimize, minimize and package the complete dependency tree before going live.
The assertion that no developer will ever be using any older browsers during their product
development.

Chained module syntax with some form of self-awareness, module.js
enforces a sequential dependency resolution and will ensure that
a module's dependencies and their respective dependencies are resolved 
before running the module definition.

Concider the following dependency tree:

- main
  - foo
    - bar
      - baz
      - bon
      
The main module will not run its definition until the baz and bon 
modules have been resolved and included. In this case the module definitions 
would run in the following order:

baz -> bon -> bar -> foo -> main

###API

The module.js API is nothing special and can be explained very briefly,
so here is what you need to know about the required HTML and JavaScript.

####HTML

Add a script element that includes module.js as its source and
be sure to set the "data-main" property to the path of your root/main
module, all other modules will be included relatively using that 
base-path.

    <script data-main="source/main" src="module.js"></script>

####JavaScript

The easiest way to display how the modules work is by giving an example, 
so here is a short explanation of the methods and then a piece of the example code.

- module 
  - Is a magic global property that that defines itself when used in a new script, due to this a script can only define one module, which is how I like it, but probably not everyone.
  - The module property can be assigned to directly if the module has no dependencies, see the minimal boilerplate example
  - NOTE: module.js will self-destruct after all dependencies have been resolved, hence the module property will not be available after the last module has been included.

- method <module>.require( string dep_1, string dep_2, ..., string dep N )
  - Add a new requirement to the module, this method has to be run before the .define method, the path does not require an extension ".js" and is relative to the current module's location.

- property <module>.define = function definer
  - The function to be run that defines the module, the function MUST return the module definition, which can be an object, function, array, number, anything but undefined. The only module exempt from this rule is the one defined as the main module, it doesn't need to return anything as it cannot be depended upon.
  - The .define function gains the dependencies as parameters in the order of which they are depended upon.

#####Directory structure

- index.htm
- source
  - main.js
  - bar
    - bar.js
  - foo
    - foo.js
  - libs
    - foobar
      - foobar_bar.js
      - foobar_foo.js
    - lib.event.js
    - lib.foobar.js

Here are the two modules that depend on others and a sample of a module that has no further dependencies:

#####main.js

    module
    
	.require( "libs/lib.foobar" )
	.require( "libs/lib.event" )
    
	.require( "bar/bar" )
	.require( "foo/foo" )
    
	.define = function ( foobar, event, bar, foo ) {
    
    		console.log( foobar, event, bar, foo );
    
    };
    
#####lib.foobar.js

    module

	.require( "foobar/foobar_foo" )
	.require( "foobar/foobar_bar" )

	.define = function ( foo, bar ) {
  
		return {
			"Foo": foo,
			"Bar": bar
		};

    };
    
#####foo.js

    module = function ( ) {

		return function Foo () {};

    };
