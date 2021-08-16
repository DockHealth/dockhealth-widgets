const EMPTY_ARRAY = [];

class DockHealthWidgetSdk {
    constructor(options = {}) {
        this.listeners = {}

        this.onStateChanged = this.onStateChanged.bind(this)
        this._fireStateChanged = this._fireStateChanged.bind(this)

        this.onItemChanged = this.onItemChanged.bind(this)
        this._fireItemChanged = this._fireItemChanged.bind(this)

        this.onNavigate = this.onNavigate.bind(this)
        this.navigate = this.navigate.bind(this)

        this._receiveMessage = this._receiveMessage.bind(this)
        window.addEventListener('message', this._receiveMessage, false)
    }

    onStateChanged(callback) {
        console.log('onStateChanged')
        this._addListener('onStateChanged', callback)
    }

    onItemChanged(callback) {
        console.log('onItemChanged')
        this._addListener('onItemChanged', callback)
    }

    onNavigate(callback) {
        console.log('onNavigate')
        this._addListener('onNavigate', callback)
    }

    navigate(newLocation) {
        console.log('navigate')
        this._sendMessage('onNavigate', newLocation)
    }

    _fireStateChanged(newState) {
        this._sendMessage('onStateChanged', newState)
    }

    _fireItemChanged(newItem) {
        this._sendMessage('onItemChanged', newItem)
    }

    _sendMessage(method, args) {
        return new Promise((resolve, reject) => {
            const requestId = this._generateRequestId()
            const clientId = this._clientId
            const pjson = require('../package.json')
            const version = pjson.version

            // TODO: Send correct origin!
            window.parent.postMessage({ method, args, requestId, clientId, version }, '*')
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
        console.log('Adding listener: ' + key)
        this.listeners[key] = this.listeners[key] || []
        this.listeners[key].push(callback)
    }

    _removeEventListener() {
        console.log('Removing listener.')
        window.removeEventListener('message', this._receiveMessage, false)
    }

    _clearListeners() {
        console.log('Clearing listeners.')
        this.listeners = []
    }

    _generateRequestId() {
        return Math.random()
            .toString(36)
            .substr(2, 9)
    }
}

function init(options = {}) {
    return new DockHealthWidgetSdk(options)
}

module.exports = init