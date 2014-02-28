
#Questions and Answers

##In case of two or more modules depending on the same module

In  the case of two or modules, depending on the same module, they will not 
recieve different instances of that module, they will recieve a shared instance. 
In essence, a module can and will only be declared once.

E.g.

    //Script bar.js:
    module.require( "foo" ).define( function ( foo  ) {...}  )

    //Script baz.js:
    module.require( "foo" ).define( function ( foo  ) {...}  )

    //Script foo.js:
    module.define( function (   ) {...}  )
    
    /* Modules bar and baz will have the same instance of foo  */
