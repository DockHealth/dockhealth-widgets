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
            const pjson = require('../package.json')
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