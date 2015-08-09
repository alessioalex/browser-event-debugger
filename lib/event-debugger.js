'use strict';

var win = require('global/window');
var Err = require('global').Error;
var log = require('./log');

// inspired by:
// http://stackoverflow.com/questions/4787698/failure-to-override-elements-addeventlistener-in-firefox
function EventDebugger() {
  this._interfaces = {};
  var that = this;

  Object.getOwnPropertyNames(win).forEach(function getHandlers(i) {
    if (/^HTML/.test(i)) {
      if (win[i].prototype.addEventListener) {
        that._interfaces[i] = {
          addEventListener: win[i].prototype.addEventListener,
          removeEventListener: win[i].prototype.removeEventListener
        };
      }
    }
  });

  this._wrapFunction = this._defaultWrapFunction;
  this._enabled = false;
}

EventDebugger.prototype.setWrapperFunction = function setWrapperFunction(fn) {
  this._wrapFunction = fn;
};

EventDebugger.prototype.resetWrapperFunction = function resetWrapperFunction() {
  this._wrapFunction = this._defaultWrapFunction;
};

EventDebugger.prototype._defaultWrapFunction = function wrapFunction(originalFn, evt) {
  return function wrappedEventFn(type, listener, useCapture) {
    var stack = new Error().stack.split('\n');
    stack.shift() && stack.shift();

    log('EventDebugger :: ' + evt + ' | ' + type + ' |', {
      element: this,
      stack: stack,
      listener: listener,
      useCapture: useCapture
    });

    return originalFn.apply(this, arguments);
  };
};

EventDebugger.prototype.extendErrorStackLimit = function extendErrorStackLimit() {
  if (!this._originalErrorStackLimit) {
    this._originalErrorStackLimit = Err.stackTraceLimit;
  }

  Err.stackTraceLimit = Infinity;
};

EventDebugger.prototype.revertErrorStackLimit = function revertErrorStackLimit() {
  Err.stackTraceLimit = this._originalErrorStackLimit;
};

EventDebugger.prototype.start = function startSniffing() {
  var that = this;

  // do nothing if already enabled
  if (this._enabled) {
    return false;
  }

  this._enabled = true;

  Object.keys(this._interfaces).forEach(function replaceListeners(_interface) {
    var addEventListener = that._interfaces[_interface].addEventListener;
    var removeEventListener = that._interfaces[_interface].removeEventListener;

    win[_interface].prototype.addEventListener = that._wrapFunction(addEventListener, 'addEventListener');
    win[_interface].prototype.removeEventListener = that._wrapFunction(removeEventListener, 'removeEventListener');
  });
};

EventDebugger.prototype.stop = function stopSniffing() {
  this._enabled = false;

  var that = this;

  // reset addEventListener(s) to their original fn
  Object.keys(this._interfaces).forEach(function revertListeners(_interface) {
    win[_interface].prototype.addEventListener = that._interfaces[_interface].addEventListener;
    win[_interface].prototype.removeEventListener = that._interfaces[_interface].removeEventListener;
  });
};

module.exports = EventDebugger;
