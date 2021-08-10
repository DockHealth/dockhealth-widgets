class DockHealthWidgetSdk {
    constructor(options = {}) {
        this._dockHealthDomain = options.dockHealthDomain
        if (!this._dockHealthDomain || typeof this._dockHealthDomain !== 'string') throw 'Must specify Dock Health domain as a string value.'

        this.onStateChanged = this.onStateChanged.bind(this)
        this.onItemChanged = this.onItemChanged.bind(this)
        this.navigate = this.navigate.bind(this)

        this._listeners = new Map()
        this._receiveMessage = this._receiveMessage.bind(this)
        window.addEventListener('message', this._receiveMessage)

        const pjson = require('../../package.json')
        this._version = pjson.version

        console.log('SDK Version: ' + this._version)
        console.log('Initial origin: ' + window.location)
        console.log('Dock Health domain: ' + this._dockHealthDomain)
    }

    onStateChanged(callback) {
        this._addListener('onStateChanged', callback)
    }

    onItemChanged(callback) {
        this._addListener('onItemChanged', callback)
    }

    navigate(args) {
        this._sendMessage('onNavigate', args)
    }

    _sendMessage(eventName, args) {
        if (!eventName) throw 'Must specify event name.'
        if (!args) throw 'Must specify event args.'

        console.log('_sendMessage: Event name: ' + eventName + '. Args: ' + JSON.stringify(args))

        const version = this._version
        const requestId = this._generateRequestId()
        
        window.parent.postMessage({ eventName, args, requestId, version }, this._dockHealthDomain)
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
        if (!eventName) throw 'Must specify event name.'
        if (!callback) throw 'Must specify event name.'
        this._listeners.set(eventName, callback)
        console.log('Added listener: ' + eventName)
    }

    _removeListener(eventName) {
        if (!eventName) throw 'Must specify event name.'
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
            return this._dockHealthDomain.toLowerCase() === domain.toLowerCase()
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
    return new DockHealthWidgetSdk(options)
}

module.exports = init