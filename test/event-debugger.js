/* eslint-disable func-names */
'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var should = require('should');
var clone = require('clone');

function loadSniffer(opts) {
  var deps = {
    'global/window': opts.win
  };

  if (opts.glb) {
    deps.global = opts.glb;
  }
  if (opts.log) {
    deps['./log'] = opts.log;
  }

  var EventDebugger = proxyquire('../lib/event-debugger', deps);

  return EventDebugger;
}

describe('debug-browser-events', function() {
  var EventDebugger;
  var defaultMocks = {
    win: {
      HTMLBlahElement: { prototype: {
        addEventListener: function Foo() { return 1; },
        removeEventListener: function Bar() { return 2; }
      }},
      FooBar: { prototype: {
        addEventListener: function() {},
        removeEventListener: function() {}
      }}
    },
    glb: { Error: { stackTraceLimit: 99 } },
    log: function() {}
  };

  beforeEach(function() {
    EventDebugger = loadSniffer(clone(defaultMocks));
  });

  describe('#constructor', function() {
    it('should remember original handlers', function() {
      var sniffer = new EventDebugger();

      should.deepEqual(sniffer._interfaces, {
        HTMLBlahElement: {
          addEventListener: defaultMocks.win.HTMLBlahElement.prototype.addEventListener,
          removeEventListener: defaultMocks.win.HTMLBlahElement.prototype.removeEventListener
        }
      });
    });

    it('should disable sniffer', function() {
      var sniffer = new EventDebugger();
      should(sniffer._enabled).eql(false);
    });
  });

  describe('#start', function() {
    it('should return early if sniffer is already running', function() {
      var sniffer = new EventDebugger();
      sniffer._enabled = true;

      should(sniffer.start()).eql(false);
    });

    it('should enable sniffer', function() {
      var sniffer = new EventDebugger();
      sniffer.start();
      should(sniffer._enabled).eql(true);
    });

    it('should replace original handlers', function() {
      var mocks = clone(defaultMocks);
      EventDebugger = loadSniffer(mocks);

      var sniffer = new EventDebugger();
      sniffer.start();
      should(defaultMocks.win.HTMLBlahElement.prototype.addEventListener)
        .not.eql(mocks.win.HTMLBlahElement.prototype.addEventListener);
      should(defaultMocks.win.HTMLBlahElement.prototype.removeEventListener)
        .not.eql(mocks.win.HTMLBlahElement.prototype.removeEventListener);
    });

    describe('new handlers', function() {
      it('should log data on execution', function(done) {
        var mocks = clone(defaultMocks);

        mocks.log = function(msg, data) {
          should(msg.indexOf('myEvt') !== -1).eql(true);
          should(data.listener).eql('listener');
          should(data.useCapture).eql('useCapture');
          should(!!data.stack.length).eql(true);

          done();
        };

        EventDebugger = loadSniffer(mocks);

        var sniffer = new EventDebugger();
        sniffer.start();
        mocks.win.HTMLBlahElement.prototype.addEventListener('myEvt', 'listener', 'useCapture');
      });

      it('should call the original handlers', function() {
        var mocks = clone(defaultMocks);
        var counter = 0;

        var handler = function(expType, expListener, expUseCapture) {
          return function(type, listener, useCapture) {
            should(type).eql(expType);
            should(listener).eql(expListener);
            should(useCapture).eql(expUseCapture);
            counter++;
          };
        };

        mocks.win.HTMLBlahElement.prototype.addEventListener = handler('myEvt', 'listener', 'useCapture');
        mocks.win.HTMLBlahElement.prototype.removeEventListener = handler('myOtherEvt', 'listener2', 'useCapture2');

        EventDebugger = loadSniffer(mocks);

        var sniffer = new EventDebugger();
        sniffer.start();
        mocks.win.HTMLBlahElement.prototype.addEventListener('myEvt', 'listener', 'useCapture');
        mocks.win.HTMLBlahElement.prototype.removeEventListener('myOtherEvt', 'listener2', 'useCapture2');

        should(counter).eql(2);
      });
    });
  });

  describe('#stop', function() {
    it('should revert the interfaces', function() {
      var mocks = clone(defaultMocks);
      EventDebugger = loadSniffer(mocks);

      var noop = function() {};
      var sniffer = new EventDebugger();

      mocks.win.HTMLBlahElement.prototype.addEventListener = noop;
      mocks.win.HTMLBlahElement.prototype.removeEventListener = noop;
      sniffer.stop();

      should(mocks.win.HTMLBlahElement.prototype.addEventListener)
        .eql(defaultMocks.win.HTMLBlahElement.prototype.addEventListener);
      should(mocks.win.HTMLBlahElement.prototype.removeEventListener)
        .eql(defaultMocks.win.HTMLBlahElement.prototype.removeEventListener);
    });
  });

  describe('wrap function', function() {
    it('should set a custom wrapper function', function() {
      var sniffer = new EventDebugger();
      var noop = function() {};

      sniffer.setWrapperFunction(noop);
      should(sniffer._wrapFunction).eql(noop);
    });

    it('should reset to the default wrapper function', function() {
      var sniffer = new EventDebugger();
      var noop = function() {};

      sniffer._wrapFunction = noop;
      sniffer.resetWrapperFunction();

      should(sniffer._wrapFunction).eql(sniffer._defaultWrapFunction);
    });
  });

  describe('Error.stackTraceLimit manipulation', function() {
    describe('#extendErrorStackLimit', function() {
      it('should increase the error stacktrace for better debugging', function() {
        var mocks = clone(defaultMocks);
        EventDebugger = loadSniffer(mocks);

        var sniffer = new EventDebugger();
        sniffer.extendErrorStackLimit();
        should(mocks.glb.Error.stackTraceLimit).eql(Infinity);
      });
    });

    describe('#revertErrorStackLimit', function() {
      it('should revert the Error.stackTraceLimit', function() {
        var mocks = clone(defaultMocks);
        EventDebugger = loadSniffer(mocks);

        var sniffer = new EventDebugger();
        mocks.glb.Error.stackTraceLimit = 10101;
        sniffer._originalErrorStackLimit = 10;
        sniffer.revertErrorStackLimit();

        should(mocks.glb.Error.stackTraceLimit).eql(sniffer._originalErrorStackLimit);
      });
    });
  });
});
