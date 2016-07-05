# [CSS Modules](https://github.com/css-modules/css-modules) for Meteor

**What are CSS Modules?**
"A CSS Module is a CSS file in which all class names and animation names are scoped locally by default." - [CSS modules github](https://github.com/css-modules/css-modules)

**Why use CSS Modules?**
In short, you can separate your CSS into components, just like you do with the HTML and JavaScript for your Blaze or React Templates.
Or, as stated on the main CSS modules page:

* No more conflicts.
* Explicit dependencies.
* No global scope.

## Installation

Install using Meteor's package management system:

```bash
meteor add nathantreid:css-modules
```

By default, this plugin will handle .css files as well as .m.css and .mss files (legacy). This can be adjusted in the [package options](https://github.com/nathantreid/meteor-css-modules/wiki/Package-Options).

## Supports Sass (and React Toolbox), Stylus, and Sugarss

See [the wiki](https://github.com/nathantreid/meteor-css-modules/wiki) for more details.

## BREAKING CHANGES in 2.0.0

`node-sass`, `stylus`, and `sugarss` are now user installed dependencies; they are still supported, but the npm packages are no longer bundled with the CSS modules package.
Instead, you must use `meteor npm install` to install them as needed.
Once installed, their behavior is unchanged: Sass and Stylus compilation require the `extensions` property to be set, and sugarss requires the `parser` option to be set.
See [the wiki](https://github.com/nathantreid/meteor-css-modules/wiki) for more details.


## Usage

***hello.css***
``` css
.hello {
    composes: b from "./b.css";
    color: red;
}
```

***b.css***
``` css
.b {
    font-weight: bold;
}
```

***hello.js***
``` js
import styles from "/hello.css";

Template.hello.helpers({
    styles: styles
});
```

***hello.html***
``` html
<template name="hello">
  <button class="{{styles.hello}}">Click Me</button>
</template>
```

### Relative Imports
Relative imports are supported when using the **import ... from** syntax.
Given the structure:
```
root
- client
  - hello.js
  - hello.css
```

you can do the following:

***hello.js***
``` js
import styles from "./hello.css";

Template.hello.helpers({
    styles: styles
});
```
### :local and :global
All class names and animation names are scoped locally by default. Meaning that they are expanded to be prefixed for safe usage with other CSS-files. Sometimes you may need to reference some global class within the css-specifications. 

`:global` switches to global scope for the current selector resp. identifier. `:global(.xxx)` resp. `@keyframes :global(xxx)` declares the stuff in brackets in the global scope.

Similar `:local` and `:local(...)` for local scope.

If the selector is switched into global mode, global mode is also activated for the rules. (this allows to make `animation: abc;` local)

Example:s
`.localA :global .global-b .global-c :local(.localD.localE) .global-d`

    .myButton {
        /* any css */
    }

    .myButton :global(.fa) {
        /* any css */
    }


## PostCSS Plugins
Any PostCSS plugins can be used (as long they don't conflict with the CSS modules core plugins); the following PostCSS plugins are the core CSS modules plugins and therefore used by default:

* postcss-modules-values
* postcss-modules-local-by-default
* postcss-modules-extract-imports
* postcss-modules-scope

**The above plugins are required for full CSS modules functionality; the first is optional unless you use values, but omitting the other three will likely result in errors.**

Here is my standard plugin list (in load order):

* postcss-simple-vars
* postcss-modules-values
* postcss-nested
* postcss-modules-local-by-default
* postcss-modules-extract-imports
* postcss-modules-scope
* autoprefixer

**How to load other PostCSS plugins or customize plugin options**
You can load plugins by adding them to the dependencies or devDependencies in the [package.json](https://github.com/nathantreid/css-modules-demo-meteor-1.3/blob/master/package.json#L13) file,
then also listing them under a cssModules { postcssPlugins { } } entry in the [same file](https://github.com/nathantreid/css-modules-demo-meteor-1.3/blob/master/package.json#L26).
**If you modify the `postcssPlugins` option, make sure to also include the core CSS modules plugin as described above.**

``` js
{
  "devDependencies": {
    "postcss-simple-vars": "1.1.0"
  },
  "cssModules": {
    "postcssPlugins": {
      "postcss-simple-vars": {},
      "postcss-modules-local-by-default": {},
      "postcss-modules-extract-imports": {},
	  "postcss-modules-scope": {},
    }
  }
}
```

If a plugin you added is causing the build step to fail, carefully consider it's placement as the plugins are loaded in the order they are specified under the cssModules entry.

Plugin options can be set in 2 ways:
1. inline in the package.json
2. in files referenced from the package.json

To set inline options, specify them under the plugin entry like so:

``` js
  "cssModules": {
    "postcssPlugins": {
      "my-postcss-plugin": {
        "inlineOptions": {
          "option1": true
      }
    }
  }
```

To reference options from a file, specify them under the plugin entry like so:
``` js
  "cssModules": {
    "postcssPlugins": {
      "my-postcss-plugin": {
        "fileOptions": [
          "path/to/file1",
          "path/to/file2"
        ]
    }
  }
```

If you set inline and file options, they will be combined.

## Global Variables

While explicit composition is a very good thing, sometimes global variables are a good thing, such as for colors which are constant throughout the app.
Reimporting the variables every time you need them can get tiresome, but thankfully you can do so by  including the postcss-simple-vars plugin!

First, install the postcss-simple-vars plugin and configure it to load. Next, create a json file to hold your global variables. For the sake of this example, create a colors.json file containing the following data:

**colors.json**

``` JSON
{
  "primary": "green"
}
```
This defines your first variable, *primary*.
Now update your package.json with the following data:

**package.json**

``` JSON
{
  "cssModules": {
    "globalVariables": [
      "colors.json"
    ]
  }
}
```

This is an array, so you can specify as many files as you like.
Now to use the variable you created in any of your files:

**example.css**

``` css
.example {
  color: $primary;
}
```

Please [see the demo](https://github.com/nathantreid/css-modules-demo-meteor-1.3) for a working example.

## Server-side Processing

To enable server-side processing, set "specificArchitecture": false in your cssModules config:
``` JSON
{
  "cssModules": {
    "specificArchitecture": false
  }
}
```

You can also use any archMatching option (the default is 'web', or client-side only processing). To only allow server-side processing, set `"specificArchitecture": "os"`.


## History

* See https://github.com/nathantreid/meteor-css-modules/blob/master/CHANGELOG.md for updates

## Acknowledgements

This plugin was developed using the CSS modules implementation found here: https://github.com/css-modules/css-modules-loader-core
The Meteor 1.3 implementation drew inspiration from the excellent [juliancwirko:postcss](https://github.com/juliancwirko/meteor-postcss) plugin.

