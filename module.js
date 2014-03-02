
( function () {

	"use strict";

	var debug = true,
		debugtime = Date.now(),
		debuglog = function ( message ) {
			if ( debug === true ) {

				var i = queue.length,
					message = message;

				for ( i; i--; )
					message = "    " + message;

				console.log( message );

			}
		}

	var module = Object.create( null ),
		dotick = true,
		modules = {},

		order = [], // The dependency order list, if wanted
		queue = [], // The backlog queue

		// Static memory variables

		current = "", // The current module name
		relative = "", // The module relative path

		boot = document.querySelector( 'script[src="module.js"]' ),
		path = boot.getAttribute( "data-main" );

	path = path.split( /\//g );

	var main = path.pop(),
		root = path.join( "/" ) + "/";

	current = main;
	relative = "";

	// Handles any exceptions that may occur
	// in asynchronous actions.

	var req_err = function ( e ) {

		dotick = false;
		window.removeEventListener( "error", req_err, false );

	}

	window.addEventListener( "error", req_err, false );

	// Add a module dependency
	// This MUST be done before calling define
	module.require = function require () {

		var args = Array.prototype.slice.call( arguments, 0 );
		this.dependencies = this.dependencies.concat( args );

		return this; //modules[ named( current ) ].define;

	}

	// Defines the module scope
	Object.defineProperty( module, "define", {

		set: function ( scope ) {

			this.definer = scope;
			queue.unshift( this );
			return this;

		}

	} );

	/**
	  * <module>.next(  )
	  *
	  * Loops through the module dependencies to see
	  * which dependency should be included next, if all
	  * are resolved, return false;
	  *
	  * @return mixed dependency
	  */
	module.next = function next ( ) {

		var id = "";

		for ( var i = 0; i < this.dependencies.length; i++ ) {

			id = named( this.dependencies[ i ] );

			if ( typeof( modules[ id ] ) == "undefined" )
				return this.dependencies[ i ];

		}

		return false;

	}

	/**
	  * function parameters( module entry )
	  *
	  * Loops through the module dependencies to assign
	  * which parameters should be sent to the definer function.
	  *
	  * @param module entry
	  * @return array params
	  */
	function parameters ( entry ) {

		var deps = entry.dependencies,
			parameters = [],
			i = deps.length,
			id = "";

		for ( i; i--; ) {

			id = named( deps[ i ] );
			parameters.push( modules[ id ] );

		}

		return parameters.reverse();

	}

	/**
	  * function tick()
	  *
	  * Handles the sequential dependency inclusion
	  * based on the dependency queue.
	  *
	  * Shifts module entries from the queue and checks
	  * it for dependencies, if all dependencies are fulfilled
	  * if runs the module definition function, otherwise
	  * resolves the first found unfulfilled dependency.
	  *
	  * When the queue is empty it orders module.js to
	  * self-destruct in order to free global scope and
	  * remove all event listeners.
	  */
	function tick () {

		if ( queue.length > 0 ) {

			var entry = queue[ 0 ],
				next = entry.next();

			setpath( current );
			current = next || current;

			if ( next == false ) {

				var params = parameters( entry );

				debuglog( "resolved dependencies for " + entry.name );

				order.push( entry.name );
				modules[ entry.name ] = entry.definer.apply( entry, params );
				queue.shift();

				tick();

			} else {

				setpath( entry.path );
				append( next );

			}

		} else {

			window.removeEventListener( "error", req_err, false );
			boot.parentNode.removeChild( boot );
			delete window.module;

			debugtime = Date.now() - debugtime;
			debuglog( debugtime + "ms to resolve" );

		}

	}

	/**
	  * function named( string source )
	  *
	  * Get the name of a module by source
	  *
	  * @param string source
	  * @return string name
	  */
	function setpath ( source ) {

		source = (root + source).split( /\// );
		source.shift();
		source.pop();

		relative = source.join( "/" );
		if ( relative ) relative = "/" + relative + "/";

	}

	/**
	  * function named( string source )
	  *
	  * Get the name of a module by source
	  *
	  * @param string source
	  * @return string name
	  */
	function named ( source ) {

		source = source.split( /\//g );
		source = source.pop();

		return source.replace( /\.js$/, "" );

	}


	/**
	  * function url( string source )
	  *
	  * Expands a module source into the relative
	  * url by minor schema checks and preprending
	  * the source root
	  *
	  * @param string source
	  * @return string url
	  */
	function url ( source ) {

		source = relative + source;
		var src = root + source;

		if ( !src.match( /^\.\// ) )
			src = "./" + src;

		if ( !src.match( /\.js$/ ) )
			src = src + ".js";

		src = src.replace( /\/+/g, "/" );
		return src;

	}

	/**
	  * function script ( source )
	  *
	  * Creates and returns a new script element
	  */
	function createScript ( source ) {

		var script = document.createElement( "script" );
		script.setAttribute( "src", source );
		script.setAttribute( "async", false );
		return script;

	}

	/**
	  * function append( name )
	  *
	  * Appends a module to the DOM by appending a script tag,
	  * the function uses the url() function to resolve source
	  * from name.
	  *
	  * @param string name
	  * @return void
	  */
	function append ( name ) {

		var source = url( name ),
			script = createScript( source ),
			loaded = false;

		debuglog( "injecting " + name );

		var handler = function ( e ) {

			var id = named( name );

			script.removeEventListener( "load", handler, false );

			if ( !loaded ) {

				loaded = true;

				if ( !modules[ id ] )
					throw "Script " + source + " does not define a module";

				if ( dotick )
					tick();

			}

		};

		script.addEventListener( "load", handler, false );
		script.addEventListener( "error", function ( e ) {
			throw "Module <" + name + "> could not be loaded from " + source;
		}, false );

		document.head.insertBefore( script, boot );

	}


	/**
	  * function factory( name )
	  *
	  * Initializes a new module definition chain
	  *
	  * @param string name
	  * @return void
	  */
	function factory ( name ) {

		var id = named( name );

		if ( typeof( modules[ id ] ) == "undefined" ) {

			modules[ id ] = Object.create( module );
			modules[ id ].dependencies = [];
			modules[ id ].name = id;
			modules[ id ].path = relative + name;

			return modules[ id ];

		} else {

			throw "Module <" + id + "> already exists!";

		}

	}


	/**
		* magical property module
		*
		* Getting the module property ( of window )
		* will automatically invoke the factory function
		* and initialize a new module that can be chained
		* into latter .require and .define methods.
		*
		* Setting the module property cannot be done, attempting
		* at doing so will throw an error.
		*
		* When all dependencies have been resolved ( hence
		* module.js is no longer needed, module.js will remove
		* itself and its event handlers, leaving you with only
		* your contained modules ).
		*/
	Object.defineProperty( window, "module", {

		"get": function () {

			return factory( current );

		},

		"set": function ( value ) {

			if ( typeof( value ) == "function" ) {

				var m;

				if ( modules[ named( current ) ] )
					m = modules[ named( current ) ]
				else m = factory( current );
				m.define = value;

			} else {
				throw "module cannot be overwritten but will self-destruct after completion";
			}

		},

		"configurable": true

	} );

	append( main );

} ) ();