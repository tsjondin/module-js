
#Questions and Answers

##In case of two or more modules depending on the same module

In  the case of two or modules, depending on the same module, they will not
recieve different instances of that module, they will recieve a shared instance.
In essence, a module can and will only be declared once.

E.g.

    //Script bar.js:
    module.require( "foo" ).define = function ( foo  ) {...}

    //Script baz.js:
    module.require( "foo" ).define = function ( foo  ) {...}

    //Script foo.js:
    module = function (   ) {...}

    /* Modules bar and baz will have the same instance of foo  */

##Requiring from root

In case you have traversed into the directory in order to include modules
and you find that you would like to depend on something that cannot be reached
using the regular relative path syntax, you may include from the source root
by prefixing the path with a slash

    // Using "source" as root
    module.require( "/something/relative/to/root" )
    // Would require from "source/something/relative/to/root"

##Requiring from CDN

If all your modules are on a CDN you may simply set the data-main root as
your CDN script source root.

    // index.htm
    <script data-main="http://abcdefg1234567.cloudfront.net/source/main" src="module.js"></script>

    // main.js
    module.require( "foo", "foobar/bar" ).define = ...

    /*
      Would require from:
        http://abcdefg1234567.cloudfront.net/source/foo.js
        http://abcdefg1234567.cloudfront.net/source/foobar/bar.js
    */

If you only have some requirements on CDN you may require them explicitly from the CDN.
This rule applies to other scripts that may not be located on your server, if you specify
a protocol (HTTP/HTTPS) it will treat it as a full URL.

    // index.htm
    <script data-main="source/main" src="module.js"></script>

    // main.js
    module.require(
      "http://abcdefg1234567.cloudfront.net/source/foo",
      "foobar/bar"
    ).define = ...

    /*
      Would require from:
        http://abcdefg1234567.cloudfront.net/source/foo.js
        source/foobar/bar.js
    */