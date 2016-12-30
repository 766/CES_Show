/**
 * Created by KangWei on 2016/12/28.
 * 2016/12/28 12:49
 * CESDemo
 */
const SECOND_UNIT = 1000;
let skip = {};
skip.node = {};
let skipHeart;
skip.connect = function (mac, type) {
    apiImpl.conn({node: mac, type: type});
};

skip.onConnect = function (node, htmlElementId) {
    $("#" + htmlElementId).css('background', 'green');
    skip.node = node;
    skip.status = true;
    this.openSkip();
};

skip.disconnect = function () {
    apiImpl.conn.close({node: skip.node})
};

skip.openSkip = function () {
    apiImpl.write({
        node: skip.node,
        handle: '27',
        value: '0100'
    })
};

skip.notify = function (htmlElement, data) {
    clearInterval(skipHeart);
    skipHeart = setInterval(function () {
        logd('已经10秒钟没有收到跳绳的数据了');
        skip.onDisconnect();
        clearInterval(skipHeart)
    }, 10 * SECOND_UNIT);
    htmlElement.html(data.skipNumber + "of" + parseInt(parseInt(data.timeInterval, 16) / 1024) + "s");
};

skip.setDisconnectListener = function (onDisconnect) {
    skip.onDisconnect = onDisconnect;
};

function formatSkippingData(value) {
    return {
        length: parseInt(value.substr(0, 2), 16),
        direction: value.substr(2, 2) == '10' ? "SKIP_DIR_FORWARD" : "SKIP_DIR_BACKWARD",
        skipNumber: parseInt(value.substr(4, 8), 16),
        timeInterval: value.substr(12, 4),
        checksum: value.substr(16, 2)
    };
}


