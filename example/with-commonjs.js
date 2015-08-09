var EventDebugger = require('browser-event-debugger');

// Advanced usage: you want to intercept `addEventListener` and `removeEventListener`
// using your custom function

// EventDebugger.setWrapperFunction(function(originalFn, evt) {
//   return function wrappedEventFn(type, listener, useCapture) {
//     console.log('EventDebugger :: ' + evt + ' | ' + type + ' |', {
//       element: this,
//       listener: listener
//     });

//     return originalFn.apply(this, arguments);
//   };
// });
EventDebugger.start();

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

// when you want things back to normal:
// EventDebugger.stop();
