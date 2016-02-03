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
meteor remove ecmascript
meteor add nathantreid:css-modules
```

In order to support the **import ... from** syntax, this plugin will need to handle your JS files. **This plugin includes the meteor ecmasscript compiler, so you still get all of the ES6 goodness!**
If you don't want the **import ... from** syntax for JavaScript files, you can just install the MSS processor. In this case you will need to use the alternative JS import syntax shown in the Usage section below.

```bash
meteor add nathantreid:css-modules-mss
```

## Usage

Because Meteor 1.2 doesn't allow build plugins to handle CSS files, you will need to use the .mss (Modular Style Sheet) extension.

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
import * as styles from "{}/hello.mss";

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

***Alternative JS import syntax***
``` js
Template.hello.helpers({
    styles: CssModules.import("{}/hello.mss")
});
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
import * as styles from "./hello.mss";

Template.hello.helpers({
    styles: styles
});
```


This will be converted to:
``` js
var styles = CssModules.import("{}/client/hello.mss");

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
then also listing them under a cssModules { plugins { } } entry in the [same file](https://github.com/nathantreid/css-modules-demo-meteor-1.3/blob/master/package.json#L26).

``` js
{
  "devDependencies": {
    "postcss-simple-vars": "1.1.0"
  },
  "cssModules": {
    "plugins": {
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
    "plugins": {
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
    "plugins": {
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
Reimporting the variables every time you need them can get tiresome, but thankfully you can do so by passing your variables in to the postcss-simple-vars plugin!

First, create a json file to hold your global variables. For the sake of this example, create a colors.json file containing the following data:

**colors.json**

``` JSON
{
  "variables": {
    "primary": "green"
  }
}
```
This defines your first variable, *primary*.
Now update your package.json with the following data:

**package.json**

``` JSON
{
  "cssModules": {
    "plugins": {
      "postcss-simple-vars": {
        "fileOptions": [
          "colors.json"
        ]
      }
    }
  }
}
```

This is an array, so you can specify as many files as you like. If the file is in a subdirectory, you can use either of these 2 forms to reference it:

* path/to/file.json
* {}/path/to/file.json

If the file is in a local package, you can use either of these 2 forms to reference it:

* {author:package}/path/to/file.json
* packages/[package-folder]/path/to/file.json

Now use the variable you created in any of your .mss files:

**example.mss**

``` css
.example {
  color: $primary;
}
```

Please [see the demo](https://github.com/nathantreid/css-modules-demo-meteor-1.3) for a working example.

## History

* 11/2015: Implementation of CSS Modules for Meteor released
* 11/2015: Shortened auto-generated class names by excluding irrelevant path information
* 11/2015: Implemented source maps
* 11/2015: Added additional postcss plugins (nested, nested props, media min/max, colorHexAlpha, anyLink, and notSelector.
* 11/2015: Implemented global variables via the postcss-simple-vars plugin
* 11/2015: **Any** NPM-listed PostCSS plugin specified in packages.json and css-modules.json will be loaded. Freedom!
* 02/2016: Updates for Meteor 1.3; css-modules.json is now combined with package.json

## Todo

* consider replacing Meteor's .css processor (replace standard-minifiers)

## Acknowledgements

This plugin was developed using the CSS modules implementation found here: https://github.com/css-modules/css-modules-loader-core
The Meteor 1.3 implementation drew inspiration from the excellent [juliancwirko:postcss](https://github.com/juliancwirko/meteor-postcss) plugin.

