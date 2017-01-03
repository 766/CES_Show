let apiImpl;
let BRACELET_TYPE = "1";
let SKIP_TYPE = "2";
let BELT_TYPE = "3";
let HUB_CONNECT_TIMEOUT = 20 * 1000; // 20s
let devices;
let config = 'normal';
let timer1;
let timer2;

function restoreData(devices) {
    if (devices) {
        for (let i = 0; i < devices.length; i++) {
            let device = devices[i];
            switch (device.type) {
                case BRACELET_TYPE:
                    $('#bracelet_mac').attr({value: device.mac + ',' + device.user});
                    utils.devicesMac.bracelet = device.mac;
                    bracelet.node = device.mac;
                    apiImpl.conn.close({node: device.mac});
                    break;
                case SKIP_TYPE:
                    $('#skip_mac').attr({value: device.mac + ',' + device.user});
                    utils.devicesMac.skip = device.mac;
                    skip.node = device.mac;
                    apiImpl.conn.close({node: device.mac});
                    break;
                case BELT_TYPE:
                    $('#belt_mac').attr({value: device.mac + ',' + device.user});
                    utils.devicesMac.belt = device.mac;
                    belt.node = device.mac;
                    break;
            }
        }
    }
}

$(function () {
    let arrUl = $('.show-pannel ul');
    
    let lStorage = window.localStorage;
    
    let defaultData = {
        devices: '',
        hubIp: ''
    };
    
    if (lStorage.cassia) {
        defaultData = JSON.parse(lStorage.cassia);
        devices = defaultData.devices;
        apiImpl = api.use({
            server: defaultData.hubIp || '192.168.0.109',
        });
        
        restoreData(devices);
        fillData(defaultData.devices);
    }
    
    let alertContent = `<div class="layui-form config">
                <div class="layui-form-item">
                    <label class="layui-form-label">HUB IP</label>
                    <div class="layui-input-inline">
                        <input type="text" name="hubIp" id="hub_ip" placeholder="Please type the local hub's ip"   value="" class="layui-input">
                    </div>
                </div>
                <div class="layui-form-item">
                    <label class="layui-form-label">Bracelet & User</label>
                    <div class="layui-input-inline">
                        <input type="text" name="bracelet_mac" id="bracelet_mac"  placeholder="Please type the device mac with user" class="layui-input">
                    </div>
                </div>
                <div class="layui-form-item">
                    <label class="layui-form-label">Skip & User</label>
                    <div class="layui-input-inline">
                        <input type="text" name="skip_mac"   id="skip_mac" placeholder="Example: E9:14:DD:A4:C2:9C,User1" class="layui-input">
                    </div>
                </div>
                
                <div class="layui-form-item">
                    <label class="layui-form-label">Belt & User</label>
                    <div class="layui-input-inline">
                        <input type="text" name="belt_mac"   id="belt_mac" class="layui-input">
                    </div>
                </div>

                <div class="layui-form-item">
                    <div class="layui-button" style='padding: 0px 61px;'>
                        <button class="layui-btn layui-btn-warm" id="test" >test</button>
                        <button class="layui-btn layui-btn-warm" id="reset">Reset</button>
                        <button class="layui-btn layui-btn-warm" id="finish" >Done</button>
                    </div>
                </div>

            </div>`;
    
    function testRun() {
        let b_cal = $('#b_cal');
        let b_hr = $('#b_hr');
        let b_step = $('#b_step');
        let rate = $('#rate');
        let hr = $('#hr');
        
        let baseStep = 0;
        let baseSkip = 0;
        $('#belt_hr_img').attr('src', "./src/gif/heart.gif");
        $('#step_img').attr('src', './src/gif/running.gif');
        $('#skip_img').attr('src', './src/gif/rope.gif');
        function getHrData() {
            let num = Math.random() * 30 + 80;
            return parseInt(num, 10);
        }
        
        timer1 = setInterval(function () {
            b_hr.html(getHrData());
            b_step.html(baseStep += 1);
            let cel = parseInt(baseStep * 0.54 * 10);
            b_cal.html(parseFloat(cel * 0.1).toFixed(1));
            
            hr.html(getHrData());
        }, 1 * SECOND_UNIT);
        
        timer2 = setInterval(function () {
            rate.html(baseSkip += 1);
        }, 0.2 * SECOND_UNIT)
    }
    
    
    /**
     * li 标签的模板
     */
    function sampleTem(obj) {
        let uiHtml = "";
        if (!obj)return;
        for (let i = 0; i < obj.length; i++) {
            let device = obj[i];
            if (device.mac) {
                switch (device.type) {
                    case BRACELET_TYPE:
                        uiHtml += (`
                        <li>
                        <h2>${device.user}</h2><div class="circle" id="bracelet_status"></div>
                        <div><input id="content" type="text" class="layui-input-inline input-mesg"><button id="send" class="layui-btn layui-btn-warm send_button">Say Hi</button></div>
                        <div class="yellow">
                        <img src="./src/img/fire_static.jpg" alt="icon" id="cal_img">
                        <p><span id="b_cal"></span>cal</p>
                        </div>
                        <div class="red">
						<img src="./src/img/heart_staic.jpg" alt="icon" id="bracelet_hr_img">
						<p><span id="b_hr"></span>/s</p>
					    </div>
					    
					    <div class="blue">
                        <img src="./src/img/running_static.jpg" alt="icon" id="step_img">
                        <p><span id="b_step"></span>Steps</p>
                        </div>
                        </li>
                        `);
                        break;
                    case SKIP_TYPE:
                        uiHtml += (`
                        <li>
                        <h2>${device.user}</h2><div class="circle" id="skip_status"></div> 

                        <div class="blue" style="left: 13%;top: 42%">
						<img src="./src/img/rope_staic.png" alt="icon" id="skip_img">
						<p><span id="rate"></span></p>
					    </div>
                        </li>
                        `);
                        break;
                    case BELT_TYPE:
                        uiHtml += (`
                        <li>
                        <h2>${device.user}</h2><div class="circle" id="belt_status"></div> 
                        <div class="red" style="left: 13%;top: 42%">
						<img src="./src/img/heart_staic.jpg" alt="icon" id="belt_hr_img">
						<p><span id="hr"></span>/s</p>
					    </div>
                        </li>
                        `);
                        break;
                }
            }
        }
        return uiHtml;
    }
    
    function fillData(data) {
        console.log('receiveData:', data);
        arrUl.html(sampleTem(data))
        
    }
    
    let body = $('body');
    
    body.delegate('#send', 'click', function () {
        logd('sned clicked');
        bracelet.api = apiImpl;
        bracelet.sendMsg($('#content').val());
    });
    body.delegate('#startWork', 'click', function () {
        let beltHeart;
        console.log('scan clicked');
        
        if (config == 'normal') {
            apiImpl.scan()
        } else {
            clearInterval(timer1);
            clearInterval(timer2);
            testRun();
        }
        
        apiImpl.on('scan', function (hub, data) {
            // console.log(hub, data);
            if (utils.isContains(data, 'keep-alive')) {
                return;
            }
            
            let devInfo = JSON.parse(data);
            let mac = devInfo.bdaddrs[0].bdaddr;
            let type = devInfo.bdaddrs[0].bdaddrType;
            if (utils.isBelt(mac)) {
                let hr = belt.getHr(devInfo.adData);
                clearInterval(beltHeart);
                beltHeart = setInterval(function () {
                    // beltStatus.css('background', 'red');
                    $('#belt_hr_img').attr('src', "./src/img/heart_staic.jpg");
                    $('#hr').html(0);
                    clearInterval(beltHeart)
                }, 10 * SECOND_UNIT);
                // beltStatus.css('background', 'green');
                $('#belt_hr_img').attr('src', "./src/gif/heart.gif");
                $('#hr').html(hr);
            } else {
                if (!utils.isHubConnecting()) {
                    if (utils.isBracelet(mac) || utils.isSkip(mac)) {
                        logd('find matched dev :' + "name :" + devInfo.name + "mac :" + mac);
                        utils.setHubConnectingStatus(true);
                        utils.openTimerTask();
                        if (utils.isBracelet(mac)) {
                            bracelet.setDisconnectListener(function () {
                                // $('#bracelet_status').css('background', 'red');
                                bracelet.disconnect(function () {
                                    // let hrImg = $('#bracelet_hr_img');
                                    // let calImg = $('#cal_img');
                                    let stepImg = $('#step_img');
                                    // hrImg.attr('src', './src/img/heart_staic.jpg');
                                    // calImg.attr('src', './src/img/fire_static.jpg');
                                    stepImg.attr('src', './src/img/running_static.jpg');
                                });
                                $("#b_hr").html(0);
                            });
                            bracelet.connect(mac, type);
                        } else if (utils.isSkip(mac)) {
                            skip.setDisconnectListener(function () {
                                // $('#skip_status').css('background', 'red');
                                skip.disconnect(function () {
                                    $('#skip_img').attr('src', './src/img/rope_staic.png');
                                });
                                $("#rate").html(0);
                            });
                            skip.connect(mac, type, function () {
                                skip.openSkip();
                            });
                        }
                        
                        apiImpl.on('conn', function (hub, node, data) {
                            logd('conn!', data);
                            utils.setHubConnectingStatus(false);
                            if (utils.isBracelet(node)) {
                                bracelet.onConnect(node, function () {
                                    // let hrImg = $('#bracelet_hr_img');
                                    // let calImg = $('#cal_img');
                                    let stepImg = $('#step_img');
                                    // hrImg.attr('src', './src/gif/heart.gif');
                                    // calImg.attr('src', './src/gif/fire.gif');
                                    stepImg.attr('src', './src/gif/running.gif');
                                });
                            } else if (utils.isSkip(node)) {
                                skip.onConnect(node, function () {
                                    let skipImg = $('#skip_img');
                                    skipImg.attr('src', './src/gif/rope.gif');
                                })
                            }
                        });
                        
                        apiImpl.on('notify', function (hub, data) {
                            logd(' notification is:' + data);
                            if (utils.isContains(data, 'keep-alive'))return;
                            let dataObj = JSON.parse(data);
                            if (utils.isBracelet(dataObj.id)) {
                                bracelet.notify(dataObj.value, '#b_hr', '#b_step', '#b_cal');
                            } else if (utils.isSkip(dataObj.id)) {
                                let skipData = formatSkippingData(dataObj.value);
                                skip.notify($("#rate"), skipData);
                            }
                        });
                    }
                }
            }
        });
    });
    
    /**
     * 弹出层
     */
    
    let layerIndex;
    let objData = {};
    $('#config').click(function () {
            
            layerIndex = layer.open({
                skin: 'config-layer',
                type: 1,
                title: ['Config', 'font-size:30px;background:#f0a900;padding-top:10px;padding-bottom:10px;padding-left:20px;color:#fff;height:55px;line-height:55px;'],
                moveType: 1,
                area: ['892px', '545px'],
                shadeClose: true, //点击遮罩关闭
                content: alertContent
            });
            
            if (lStorage.cassia) {
                defaultData = JSON.parse(lStorage.cassia)
            }
            
            $('#hub_ip').attr({
                value: defaultData.hubIp
            });
            
            restoreData(defaultData.devices);
            
            $('#reset').click(function () {
                $('#hub_ip').val("");
                $('#bracelet_mac').val("");
                $('#skip_mac').val("");
                $('#belt_mac').val("");
            });
            
            $('#test').click(function () {
                config = 'test';
                let devices = [{mac: 'E9:14:DD:A4:C2:9C', user: 'bracelet', type: BRACELET_TYPE}, {
                    mac: 'D0:BF:58:A8:5A:4D',
                    user: 'skipping rope',
                    type: SKIP_TYPE
                }, {mac: 'FE:2E:F1:3A:35:F4', user: 'heart rate belt', type: BELT_TYPE}];
                fillData(devices);
                layer.close(layerIndex);
            });
            
            $('#finish').click(function () {
                config = 'normal';
                let devices = [];
                let hubIp = $('#hub_ip').val();
                let braceletContent = $('#bracelet_mac').val() + ",1";
                let skipContent = $('#skip_mac').val() + ",2";
                let beltContent = $('#belt_mac').val() + ",3";
                
                let tmp = braceletContent + ";" + skipContent + ";" + beltContent;
                
                let devicesInfo = tmp.split(';');
                for (let i = 0; i < devicesInfo.length; i++) {
                    let deviceAttrs = devicesInfo[i].split(',');
                    devices.push({
                        mac: deviceAttrs[0],
                        user: deviceAttrs[1],
                        type: deviceAttrs[2]
                    })
                }
                
                for (let i = 0; i < devices.length; i++) {
                    switch (devices[i].type) {
                        case BRACELET_TYPE:
                            utils.devicesMac.bracelet = devices[i].mac;
                            break;
                        case SKIP_TYPE:
                            utils.devicesMac.skip = devices[i].mac;
                            break;
                        case BELT_TYPE:
                            utils.devicesMac.belt = devices[i].mac;
                            break
                        
                    }
                }
                
                objData = {
                    'hubIp': hubIp,
                    'devices': devices
                };
                
                lStorage.cassia = JSON.stringify({
                    devices: objData.devices,
                    hubIp: objData.hubIp
                });
                
                apiImpl = api.use({
                    server: hubIp || '192.168.0.109',
                });
                fillData(devices);
                layer.close(layerIndex);
                return false;
            })
        }
    );
    
});
