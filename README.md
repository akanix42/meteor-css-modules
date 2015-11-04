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

##Usage

Because Meteor 1.2 doesn't allow build plugins to handle CSS files, you will need to use the .mss (Modular Style Sheet) extension.

***hello.mss***
``` css
.hello {
    color: red;
    composes: b from "./b.mss";
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

###Relative Imports
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

##Todo

1. Shorter generated class names
1. Source Maps

##Acknowledgements
This plugin was developed using the CSS modules implemenation found here: https://github.com/css-modules/css-modules-loader-core
