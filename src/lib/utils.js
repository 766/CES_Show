/**
 * Created by KangWei on 2016/12/27.
 * 2016/12/27 17:18
 * CESDemo
 */

let utils = {};
utils.hub_state_connecting = false;
utils.devicesMac = {};
let timer;
utils.isContains = function (str, substr) {
    return str.toLowerCase().indexOf(substr) >= 0 || str.toUpperCase().indexOf(substr) >= 0;
};

utils.isBelt = function (devMac) {
    return this.isContains(devMac, utils.devicesMac.belt);
};

utils.isBracelet = function (devMac) {
    return this.isContains(devMac, utils.devicesMac.bracelet);
};

utils.isSkip = function (devMac) {
    return this.isContains(devMac, utils.devicesMac.skip);
};

utils.isHubConnecting = function () {
    return utils.hub_state_connecting == true;
};

utils.setHubConnectingStatus = function (status) {
    utils.hub_state_connecting = status;
    if (!status) {
        clearTimeout(timer)
    }
};

utils.openTimerTask = function () {
    timer = setTimeout(function () {
        console.log('timer task exe');
        utils.setHubConnectingStatus(false)
    }, HUB_CONNECT_TIMEOUT);
};

