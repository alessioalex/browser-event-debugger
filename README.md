# browser-event-debugger

[![build status](https://secure.travis-ci.org/alessioalex/browser-event-debugger.png)](http://travis-ci.org/alessioalex/browser-event-debugger)
For those moments when you don't know who's adding event listeners on a page.

![pic](https://cldup.com/B1HIUnmRf1.png)

`browser-event-debugger` allows you to see which events are being added / removed, from where (stack trace), and on what elements.
By default it will log this info to the console, but you have the option to provide a custom function that wraps the original ones.

The idea came from [this stackoverflow question](http://stackoverflow.com/questions/4787698/failure-to-override-elements-addeventlistener-in-firefox).

## usage

### Standalone

If you just want to add it as a script to your page, you first you have to build it:

```sh
# this will create a EventDebugger.min.js file inside `dist`
npm run build
```

Then just include the script into your page (before events are being added).
After that you need to enable it to get it running, as in the following example:

```js
window._EventDebugger.start();

document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOM fully loaded and parsed");
});

var titleEl = document.getElementById('title');
var onClickTitle = function(event) {
  console.log("you've clicked on the title wohoo!");
};

titleEl.addEventListener("click", onClickTitle, false);
setTimeout(function() {
  titleEl.removeEventListener("click", onClickTitle, false);
}, 10000);
```

### Common.js (Browserify / Webpack)

Same as above, but instead of using `window._EventDebugger` you require it:

```js
var EventDebugger = require('browser-event-debugger');
// ...
```

## use cases

- see how framework `<INSERT NAME>` handles events, if it uses delegation or not
- determine which script added a click handler on element `<X>`
- create your own [monitor events API](http://blittle.github.io/chrome-dev-tools/console/monitor-events.html)
- etc

## tests

```sh
npm test
```

## license

[MIT](http://alessioalex.mit-license.org/)
