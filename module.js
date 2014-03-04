/*
	module.js modularization framework
  Copyright (C) 2014 Tobias Sjöndin <tsjondin at op5 dot com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

( function () {

	"use strict";

	/** User editable settings on how
	  * module.js should behave:
	  */

	var Settings = {

		debugging: true,
		strict: false

	};

	/** When using module.js you should not
	  * edit anything below this line.
	  */

	var FrameworkException = function ( message ) {
		this.name = "FrameworkException";
		this.message = message;
	}; FrameworkException.prototype = new Error;

	var ModuleException = function ( message ) {
		this.name = "ModuleException";
		this.message = message;
	}; ModuleException.prototype = new Error;

	var Framework = {

		error: function ( message ) {
			throw new ModuleException( message );
		},

		warn: function ( message ) {
			if ( Settings.debugging && console && console.warn ) {
				if ( Settings.strict ) Framework.error( message );
				else console.warn( message );
			}
		},

		log: function ( message ) {
			if ( Settings.debugging && console && console.log ) {
				console.log( message );
			}
		},

		current: "",
		relative: "",

		modules: {},
		order: [],
		queue: [],

		node: null,
		root: null,
		main: null,
		run: true,
		limit: 0,

		noextend: function ( name ) {

			var i = 0;
			for ( var property in window ) i++;
			if ( i > Framework.limit ) {
				Framework.warn( "Module <" + name + "> extends the global scope!" );
				Framework.limit = i;
			}

		},

		initialize: function () {

			Framework.node = document.querySelector( 'script[src="module.js"]' );

			var path = Framework.node.getAttribute( "data-main" );

			if ( !path ) throw new FrameworkException( "Missing data-main attribute on root-node!" );
			path = path.split( /\// );

			Framework.main = path.pop(),
			Framework.root = path.join( "/" ) + "/";
			Framework.current = Framework.main;

			for ( var property in window )
				Framework.limit++;

		}

	};

	Framework.initialize();

	var Module = Object.create( null );

	// Handles any exceptions that may occur
	// in asynchronous actions.

	var req_err = function ( e ) {

		Framework.run = false;
		window.removeEventListener( "error", req_err, false );

	}

	window.addEventListener( "error", req_err, false );


	// Add a module dependency
	// This MUST be done before calling define
	Module.require = function require () {

		var args = Array.prototype.slice.call( arguments, 0 );

		this.dependencies = this.dependencies.concat( args );

		return this;

	}


	// Defines the module scope
	Object.defineProperty( Module, "define", {

		set: function ( scope ) {

			this.definer = scope;
			Framework.queue.unshift( this );
			return this;

		},

		get: function ( ) {

			this.definer = {};
			Framework.queue.unshift( this );
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
	Module.next = function next ( ) {

		var id = "";

		for ( var i = 0; i < this.dependencies.length; i++ ) {

			id = named( this.dependencies[ i ] );

			if ( typeof( Framework.modules[ id ] ) == "undefined" )
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
			parameters.push( Framework.modules[ id ] );

		}

		return parameters.reverse();

	}


	function invoke ( entry ) {

		var params = parameters( entry );

		if ( entry.dependencies.length > 0 ) {

			if ( typeof( entry.definer ) == "function" )
				Framework.modules[ entry.name ] = entry.definer.apply( entry, params );
			else if ( typeof( entry.definer ) == "object" ) {

				for ( var i = 0; i < params.length; i++ ) {
					entry.definer[ named( entry.dependencies[i] ) ] = params[ i ];
				}

				Framework.modules[ entry.name ] = entry.definer;
			}

		} else {
			Framework.modules[ entry.name ] = entry.definer;
		}

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

		if ( Framework.queue.length > 0 ) {

			var entry = Framework.queue[ 0 ],
				next = entry.next();

			setpath( Framework.current );
			Framework.current = next || Framework.current;

			if ( next == false ) {

				Framework.order.push( entry.name );
				Framework.queue.shift();

				invoke( entry );
				tick();

			} else {

				setpath( entry.path );
				append( next );

			}

		} else {

			window.removeEventListener( "error", req_err, false );
			Framework.node.parentNode.removeChild( Framework.node );

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

		source = (Framework.root + source).split( /\// );
		source.shift();
		source.pop();

		Framework.relative = source.join( "/" );
		if ( Framework.relative ) Framework.relative = "/" + Framework.relative + "/";

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

		var src;

		if ( source.match( /^\w{3,5}\:\/\// ) ) {

			src = source;
			if ( !src.match( /\.js$/ ) )
				src = src + ".js";

			return src;

		}

		if ( !source.match( /^\// ) )
			source = Framework.relative + source;

		src = Framework.root + source;

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

		var handler = function ( e ) {

			var id = named( name );
			script.removeEventListener( "load", handler, false );

			Framework.noextend( name );

			if ( !loaded ) {

				loaded = true;

				if ( !Framework.modules[ id ] )
					Framework.error( "Script " + source + " does not define a module" );

				if ( Framework.run )
					tick();

			}

		};

		script.addEventListener( "load", handler, false );
		script.addEventListener( "error", function ( e ) {
			Framework.error( "Module <" + name + "> could not be loaded from " + source );
		}, false );

		document.head.insertBefore( script, Framework.node );

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

		if ( typeof( Framework.modules[ id ] ) == "undefined" ) {

			Framework.modules[ id ] = Object.create( Module );
			Framework.modules[ id ].dependencies = [];
			Framework.modules[ id ].name = id;
			Framework.modules[ id ].path = Framework.relative + name;

			return Framework.modules[ id ];

		} else {

			Framework.warn( "Module <" + id + "> was overwritten!" );

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

			var id = named( Framework.current );

			if ( Framework.modules[ id ] )
				return Framework.modules[ id ];
			else return factory( Framework.current );

		},

		"set": function ( value ) {

			var container;

			if ( Framework.modules[ named( Framework.current ) ] )
				container = Framework.modules[ named( Framework.current ) ]
			else container = factory( Framework.current );

			container.define = value;

		},

		"configurable": true

	} );

	append( Framework.main );

} ) ();