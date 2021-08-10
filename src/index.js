const sdk = require('./sdk')

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(factory);
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else if (root) {
      root = factory();
    }
  })(typeof self !== 'undefined' ? self : this, function() {
    if (typeof __BUNDLE__ !== 'undefined' && __BUNDLE__) {
      console.log('Window')
      window.dockHealthWidgetSdk = init;
    }
    console.log('Not Window')
    return sdk;
  });
  