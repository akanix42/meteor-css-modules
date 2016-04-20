# [CSS Modules](https://github.com/css-modules/css-modules) for Meteor

**What are CSS Modules?**
"A CSS Module is a CSS file in which all class names and animation names are scoped locally by default." - CSS modules github

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

Because Meteor 1.3 doesn't allow build plugins to handle CSS files, you will need to use another extension. The defaults are .m.css and .mss (Modular Style Sheet).
This can be configured by setting the `extensions` property in the cssModules configuration in packages.json:
```
  "cssModules": {
    "extensions": [
      "mss"
    ]
  }
```

## New: Sass / React Toolbox support!

[React Toolbox example / instructions](https://github.com/nathantreid/meteor-react-toolbox-example)

To enable Sass compilation, set the aforementioned `extensions` property to `['scss', 'sass']`.
If you are using a different file extension, set it in the `extensions` property, and also set the `enableSassCompilation` property, which defaults to `['scss', 'sass']`.

## New: Stylus support!

To enable Stylus compilation, set the aforementioned `extensions` property to `['m.styl']`.
If you are using a different file extension, set it in the `extensions` property, and also set the `enableStylusCompilation` property, which defaults to `['m.styl']`.


## Usage


***hello.mss***
``` css
.hello {
    composes: b from "./b.mss";
    color: red;
}
```

***b.mss***
``` css
.b {
    font-weight: bold;
}
```

***hello.js***
``` js
import styles from "/hello.mss";

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
  - hello.mss
```

you can do the following:

***hello.js***
``` js
import styles from "./hello.mss";

Template.hello.helpers({
    styles: styles
});
```

## PostCSS Plugins
Any PostCSS plugins can be used (as long they don't conflict with the CSS modules core plugins); the following PostCSS plugins are the core CSS modules plugins and therefore used by default:

* postcss-modules-values
* postcss-modules-local-by-default
* postcss-modules-extract-imports
* postcss-modules-scope

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

``` js
{
  "devDependencies": {
    "postcss-simple-vars": "1.1.0"
  },
  "cssModules": {
    "postcssPlugins": {
      "postcss-simple-vars": {}
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

**example.mss**

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

* 11/2015: Implementation of CSS Modules for Meteor released
* 11/2015: Shortened auto-generated class names by excluding irrelevant path information
* 11/2015: Implemented source maps
* 11/2015: Added additional postcss plugins (nested, nested props, media min/max, colorHexAlpha, anyLink, and notSelector.
* 11/2015: Implemented global variables via the postcss-simple-vars plugin
* 11/2015: **Any** NPM-listed PostCSS plugin specified in packages.json and css-modules.json will be loaded. Freedom!
* 02/2016: Updates for Meteor 1.3; css-modules.json is now combined with package.json
* 03/2016: SCSS support
* 03/2016: React Toolbox support
* 03/2016: Server-side processing


## Acknowledgements

This plugin was developed using the CSS modules implementation found here: https://github.com/css-modules/css-modules-loader-core
The Meteor 1.3 implementation drew inspiration from the excellent [juliancwirko:postcss](https://github.com/juliancwirko/meteor-postcss) plugin.

