// dock.js -- simulates the Dock Health UI.

const sdk = window.dockHealthWidgetSdk()

const fireEvent = (method, args) => {
    sdk._sendMessage(method, args)
}

const fireStateChanged = (args) => {
    fireEvent('stateChanged', args)
}

const fireItemChanged = (args) => {
    fireEvent('itemChanged', args)
}

