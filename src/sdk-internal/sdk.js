class DockHealthWidgetSdkInternal {
    constructor(options = {}) {
        this._target = options.target
        if (!this._target) throw 'Must specify target window.'

        this._targetOrigin = options.targetOrigin
        if (!this._targetOrigin || typeof this._targetOrigin !== 'string') throw 'Must specify target origin as a string value.'

        this.fireStateChanged = this.fireStateChanged.bind(this)
        this.fireItemChanged = this.fireItemChanged.bind(this)
        this.onReady = this.onReady.bind(this)
        this.onNavigate = this.onNavigate.bind(this)

        this._listeners = new Map()
        this._receiveMessage = this._receiveMessage.bind(this)
        window.addEventListener('message', this._receiveMessage)

        const pjson = require('../../package.json')
        this._version = pjson.version

        console.log('SDK Version: ' + this._version)
        console.log('Initial origin: ' + window.location)
        console.log('Target origin: ' + this._targetOrigin)
    }

    fireStateChanged(args) {
        this._sendMessage('onStateChanged', args)
    }

    fireItemChanged(args) {
        this._sendMessage('onItemChanged', args)
    }

    onReady(callback) {
        this._addListener('onReady', callback)
    }

    onNavigate(callback) {
        this._addListener('onNavigate', callback)
    }

    _sendMessage(eventName, args) {
        if (!eventName) throw 'Must specify event name.'
        if (!args) throw 'Must specify event args.'

        // NOTE: Must be careful not to attempt to access restricted props on target (via logging, etc).
        // Specifically, can't log the target here.
        console.log('_sendMessage: Event name: ' + eventName + '. Target origin: ' + this._targetOrigin + '. Args: ' + JSON.stringify(args))

        const version = this._version
        const requestId = this._generateRequestId()

        this._target.postMessage({ eventName, args, requestId, version }, this._targetOrigin)
    }

    _receiveMessage(event) {
        if (!event) throw 'No event received.'

        console.log('_receiveMessage: Event origin: ' + event.origin + '. Event data: ' + JSON.stringify(event.data))

        if (!this._isValidDomain(event.origin)) {
            console.error('_receiveMessage: Unauthorized origin: ' + event.origin)
            return
        }

        this._listeners.forEach((callback, eventName) => {
            try {
                if (eventName === event.data.eventName) {
                    console.log('Firing listener: ' + eventName)
                    callback(event.data)
                }
            } catch (err) {
                console.error('_receiveMessage: Error: ', err)
            }
        })
    }

    _addListener(eventName, callback) {
        this._listeners.set(eventName, callback)
        console.log('Added listener: ' + eventName)
    }

    _removeListener(eventName) {
        if (this._listeners.has(eventName)) {
            this._listeners.delete(eventName)
            console.log('Removed listener: ' + eventName)
        }
    }

    _clearListeners() {
        this._listeners.clear()
        console.log('Cleared listeners.')
    }

    _removeEventListener() {
        window.removeEventListener('message', this._receiveMessage, false)
    }

    _isValidDomain(domain) {
        try {
            if (!domain || typeof domain !== 'string') {
                return false
            }
            return this._targetOrigin.toLowerCase() === domain.toLowerCase()
        } catch(error) {
            return false
        }
    }

    _generateRequestId() {
        return Math.random()
            .toString(36)
            .substr(2, 9)
    }
}

function init(options = {}) {
    return new DockHealthWidgetSdkInternal(options)
}

module.exports = init
