/**
 * Created by KangWei on 2016/12/28.
 * 2016/12/28 10:42
 * CESDemo
 */
'use strict';
let belt = {};
belt.getHr = function (originalData) {
    let hrData = originalData;
    if (hrData) {
        logd(hrData);
        return parseInt(hrData.substr(hrData.length - 2, 2), 16);
    }
};