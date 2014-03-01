
( function () {

	"use strict";

	var Event = {

		add: function add ( o, type, callback ) {

			if ( document.addEventListener )
				o.addEventListener( type, callback );
			else o.attachEvent( type, callback );

		},

		remove: function remove ( o, type, callback ) {

			if ( document.removeEventListener )
				o.removeEventListener( type, callback );
			else o.detachEvent( type, callback );

		}

	}

	var debug = true,
		debuglog = function ( message ) {
			if ( debug === true ) {

				var i = queue.length,
					message = message;
				for ( i; i--; ) message = "    " + message;
				console.log( message );

			}
		}

	var module = Object.create( null ),
		dotick = true,
		modules = {},

		order = [], // The dependency order list, if wanted
		queue = [], // The backlog queue

		// Aliases

		d = document,

		// Static memory variables

		current = "", // The current module name
		relative = "", // The module relative path

		boot = d.querySelector( 'script[src="module.js"]' ),
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

		Event.remove(
			window,
			"error",
			req_err
		);

	}

	Event.add(
		window,
		"error",
		req_err
	);


	// Add a module dependency
	// This MUST be done before calling define
	module.require = function require ( source ) {

		this.dependencies.push( source );
		return this;

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

				debuglog( "Defining module " + entry.name );

				order.push( entry.name );
				modules[ entry.name ] = entry.definer.apply( entry, params );
				queue.shift();

				tick();

			} else {

				setpath( entry.path );
				append( next );

			}

		} else {

			Event.remove(
				window, "error",
				req_err
			);

			boot.parentNode.removeChild( boot );
			delete window.module;

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

		var script = d.createElement( "script" ),
			source = url( name ),
			loaded = false;

		debuglog( "Loading module " + name );

		script.src = source;
		script.async = false;

		var loadhandler = function ( e ) {

			var mod_name = named( name );

			Event.remove(
				script, "load",
				loadhandler
			);

			if ( !loaded ) {

				loaded = true;

				if ( !modules[ mod_name ] )
					throw "Script " + source + " does not define a module";

				if ( dotick )
					tick();

			}

		};

		Event.add(
			script, "load",
			loadhandler
		);

		Event.add(
			script, "error",
			function ( e ) {
				throw "Module <" + name + "> could not be loaded from " + source;
			}
		);

		d.head.appendChild( script );

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
				var m = factory( current );
				m.define = value;
			} else {
				throw "module cannot be overwritten but will self-destruct after completion";
			}

		},

		"configurable": true

	} );

	append( main );

} ) ();