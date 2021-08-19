/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 378:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const EMPTY_ARRAY = []
const EVENT_LISTENER_KEY = 'DOCK_HEALTH_WIDGET_MESSAGE'

class DockHealthWidgetSdk {
    constructor() {
        this.origin = location.hostname
        console.log('SDK origin: ' + this.domain)

        this.listeners = {}

        this.onStateChanged = this.onStateChanged.bind(this)
        this._fireStateChanged = this._fireStateChanged.bind(this)

        this.onItemChanged = this.onItemChanged.bind(this)
        this._fireItemChanged = this._fireItemChanged.bind(this)

        this.navigate = this.navigate.bind(this)
        this._onNavigate = this._onNavigate.bind(this)

        this._receiveMessage = this._receiveMessage.bind(this)
        window.addEventListener('message', this._receiveMessage, false)
    }

    // Public events and related internal triggers.
    onStateChanged(callback) {
        this._addListener('onStateChanged', callback)
    }

    _fireStateChanged(args) {
        // console.log('_fireStateChanged: Args: ' + JSON.stringify(args))
        this._sendMessage('onStateChanged', args)
    }

    onItemChanged(callback) {
        this._addListener('onItemChanged', callback)
    }

    _fireItemChanged(args) {
        // console.log('_fireItemChanged: Args: ' + JSON.stringify(args))
        this._sendMessage('onItemChanged', args)
    }

    // Public actions and related internal events.
    navigate(args) {
        // console.log('navigate: Args: ' + JSON.stringify(args))
        this._sendMessage('_onNavigate', args)
    }

    _onNavigate(callback) {
        this._addListener('_onNavigate', callback)
    }

    // Plumbing.
    _sendMessage(method, args) {
        console.log('_sendMessage: Method: ' + method + '. Args: ' + JSON.stringify(args))

        return new Promise((resolve, reject) => {
            const requestId = this._generateRequestId()
            const pjson = __webpack_require__(147)
            const version = pjson.version

            // TODO: Send correct origin!
            window.parent.postMessage({ method, args, requestId, version }, '*')
            this._addListener(requestId, data => {
                if (data.errorMessage) {
                    const error = new Error(data.errorMessage)
                    error.data = data.data
                    reject(error)
                } else {
                    resolve(data)
                }
            })
        })
    }

    _receiveMessage(event) {
        console.log('_receiveMessage: Event origin: ' + JSON.stringify(event.origin) + '. Event data: ' + JSON.stringify(event.data))

        const { method, type, requestId } = event.data
        const methodListeners = this.listeners[method] || EMPTY_ARRAY
        const typeListeners = this.listeners[type] || EMPTY_ARRAY
        const requestIdListeners = this.listeners[requestId] || EMPTY_ARRAY
        let listeners = [...methodListeners, ...typeListeners, ...requestIdListeners]

        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event.data)
                } catch (err) {
                    console.error('Message callback error: ', err)
                }
            })
        }
    }

    _addListener(key, callback) {
        this.listeners[key] = this.listeners[key] || []
        this.listeners[key].push(callback)
        console.log('Listeners: ' + JSON.stringify(this.listeners))
    }

    _removeEventListener() {
        window.removeEventListener('message', this._receiveMessage, false)
    }

    _clearListeners() {
        this.listeners = []
    }

    _generateRequestId() {
        return Math.random()
            .toString(36)
            .substr(2, 9)
    }
}

function init() {
    return new DockHealthWidgetSdk()
}

module.exports = init

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"dockhealth-widget-sdk","version":"1.0.0","private":false,"repository":"https://github.com/DockHealth/dockhealth-widgets","main":"dist/main.js","author":"Dock Health <info@dock.health>","license":"","files":["README.md","dist/","src/","examples"],"devDependencies":{"html-webpack-plugin":"^5.3.2","path":"^0.12.7","webpack":"^5.49.0","webpack-cli":"^4.7.2","webpack-dev-server":"^3.11.2"},"scripts":{"build":"webpack --mode=production","echo":"serve ."}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
(function() {
    window.dockHealthWidgetSdk = __webpack_require__(378)
})()
  
  
})();

/******/ })()
;