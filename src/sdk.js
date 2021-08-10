class DockHealthWidgetSdk {
    constructor(options = {}) {
        this.listeners = {}

        this.events = this.events.bind(this)
        this.actions = this.actions.bind(this)

        this._onMessage = this._onMessage.bind(this)
        window.addEventListener('message', this._onMessage, false);
    }

    events(name, callback, params) {
        this._addListener(name, callback);
        this._sendMessage('event', { type, params });
    }

    actions(name, params) {
        return this._sendMessage('action', { type, params });
    }

    _sendMessage(method, args) {
        return new Promise((resolve, reject) => {
            const requestId = this._generateRequestId();
            const clientId = this._clientId;
            const pjson = require('../package.json');
            const version = pjson.version;

            // TODO: Send correct origin!
            window.parent.postMessage({ method, args, requestId, clientId, version }, '*');
            this._addListener(requestId, data => {
                if (data.errorMessage) {
                    const error = new Error(data.errorMessage);
                    error.data = data.data;
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    _receiveMessage(event) {
        const { method, type, requestId } = event.data;
        const methodListeners = this.listeners[method] || EMPTY_ARRAY;
        const typeListeners = this.listeners[type] || EMPTY_ARRAY;
        const requestIdListeners = this.listeners[requestId] || EMPTY_ARRAY;
        let listeners = [...methodListeners, ...typeListeners, ...requestIdListeners];

        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event.data);
                } catch (err) {
                    console.error('Message callback error: ', err);
                }
            });
        }
    }

    _addListener(key, callback) {
        this.listeners[key] = this.listeners[key] || [];
        this.listeners[key].push(callback);
    }

    _removeEventListener() {
        window.removeEventListener('message', this._receiveMessage, false);
    }

    _clearListeners() {
        this.listeners = [];
    }

    _generateRequestId() {
        return Math.random()
            .toString(36)
            .substr(2, 9);
    }
}

function init(options = {}) {
    return new DockHealthWidgetSdk(options);
}

module.exports = init;