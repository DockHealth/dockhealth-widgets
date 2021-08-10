// widget.js -- simulates the client-side widget.

const dock = window.dockHealthWidgetSdk()

const callback = (res) => {
    console.log(res)
}

dock.events(['stateChanged', 'itemChanged'], callback);

