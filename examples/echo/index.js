const sdk = require('../../dist/main.js')

const LOG_AREA_ID = 'logAreaId'
let logArea = null

window.onload = function () {
    console.log('onLoad')
    logArea = document.getElementById(LOG_AREA_ID)
}

log = function (payload) {
    console.log(payload)
    const existing = logArea.value
    if (existing) {
        logArea.value = existing + '\n' + payload
    } else {
        logArea.value = payload
    }
}

export const onStateChangeClicked = () => {
    console.log('onStateChangeClicked')
    log('onStateChangeClicked')
}

export const onItemChangeClicked = () => {
    console.log('onItemChangeClicked')
    log('onItemChangeClicked')
}

