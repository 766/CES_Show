let apiImpl;
let BRACELET_TYPE = "1";
let SKIP_TYPE = "2";
let BELT_TYPE = "3";
let HUB_CONNECT_TIMEOUT = 20 * 1000; // 20s
let devices;

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
    
    let alertContent = `<div class="layui-form">
				<div class="layui-form-item">
					<label class="layui-form-label">HUB IP</label>
					<div class="layui-input-inline">
						<input type="text" name="hubIp" id="hub_ip" placeholder="Please type the local hub's ip"   value="" class="config-input">
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
					<div class="layui-button">
						<button class="layui-btn" id="finish" >Done</button>
						<button class="layui-btn layui-btn-primary" id="reset">Reset</button>
					</div>
				</div>

			</div>`;
    
    
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
                        <div><input id="content" class="bracelet_input"><button id="send" class="layui-btn layui-btn-warm send_button">Say Hi</button></div>
                        <div class="yellow">
                        <img src="./src/img/fire_static.jpg" alt="icon">
                        <p><span id="b_cal"></span>卡</p>
                        </div>
                        <div class="red">
						<img src="./src/img/heart_staic.jpg" alt="icon">
						<p><span id="b_hr"></span>/s</p>
					    </div>
					    
					    <div class="blue">
                        <img src="./src/img/running_static.jpg" alt="icon">
                        <a href="javascript:;" mac=${obj.mac}></a>
                        <p><span id="b_step"></span>步</p>
                        </div>
                        </li>
                        `);
                        break;
                    case SKIP_TYPE:
                        uiHtml += (`
                        <li>
                        <h2>${device.user}</h2><div class="circle" id="skip_status"></div> 

                        <div class="blue" style="left: 13%;top: 42%">
						<img src="./src/gif/rope.gif" alt="icon">
						<p><span id="rate">2</span></p>
					    </div>
                        </li>
                        `);
                        break;
                    case BELT_TYPE:
                        uiHtml += (`
                        <li>
                        <h2>${device.user}</h2><div class="circle" id="belt_status"></div> 
                        <div class="red" style="left: 13%;top: 42%">
						<img src="./src/gif/heart.gif" alt="icon">
						<p><span id="hr">2</span>/s</p>
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
    
    $('#send').click(function () {
        logd('sned clicked');
        bracelet.api = apiImpl;
        bracelet.sendMsg($('#content').val());
    });
    $('#startWork').click(function () {
        let beltHeart;
        console.log('scan clicked');
        apiImpl
            .scan()
            .on('scan', function (hub, data) {
                // console.log(hub, data);
                if (utils.isContains(data, 'keep-alive')) {
                    return;
                }
                
                let devInfo = JSON.parse(data);
                let mac = devInfo.bdaddrs[0].bdaddr;
                let type = devInfo.bdaddrs[0].bdaddrType;
                if (utils.isBelt(mac)) {
                    let hr = belt.getHr(devInfo.adData);
                    let beltStatus = $('#belt_status');
                    clearInterval(beltHeart);
                    beltHeart = setInterval(function () {
                        beltStatus.css('background', 'red');
                        $('#hr').html(0);
                        clearInterval(beltHeart)
                    }, 10 * SECOND_UNIT);
                    beltStatus.css('background', 'green');
                    $('#hr').html(hr);
                } else {
                    if (!utils.isHubConnecting()) {
                        if (utils.isBracelet(mac) || utils.isSkip(mac)) {
                            logd('find matched dev :' + "name :" + devInfo.name + "mac :" + mac);
                            utils.setHubConnectingStatus(true);
                            utils.openTimerTask();
                            if (utils.isBracelet(mac)) {
                                bracelet.setDisconnectListener(function () {
                                    $('#bracelet_status').css('background', 'red');
                                    bracelet.disconnect();
                                    $("#b_hr").html(0);
                                });
                                bracelet.connect(mac, type);
                            } else if (utils.isSkip(mac)) {
                                skip.setDisconnectListener(function () {
                                    $('#skip_status').css('background', 'red');
                                    skip.disconnect();
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
                                    bracelet.onConnect(node, "bracelet_status");
                                } else if (utils.isSkip(node)) {
                                    skip.onConnect(node, "skip_status")
                                }
                            });
                            
                            apiImpl.on('notify', function (hub, data) {
                                logd(' notification is:' + data);
                                if (utils.isContains(data, 'keep-alive'))return;
                                let dataObj = JSON.parse(data);
                                if (utils.isBracelet(dataObj.id)) {
                                    bracelet.notify(dataObj.value, '#b_hr', '#b_step', '#b_cal');
                                } else {
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
                title: ['Config', 'font-size:18px;background:#f0a900;height:75px'],
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
            
            $('#finish').click(function () {
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
    
    if ('getContext' in document.createElement('canvas')) {
        HTMLImageElement.prototype.play = function () {
            if (this.storeCanvas) {
                // 移除存储的canvas
                this.storeCanvas.parentElement.removeChild(this.storeCanvas);
                this.storeCanvas = null;
                // 透明度还原
                image.style.opacity = '';
            }
            if (this.storeUrl) {
                this.src = this.storeUrl;
            }
        };
        HTMLImageElement.prototype.stop = function () {
            let canvas = document.createElement('canvas');
            // 尺寸
            let width = this.width, height = this.height;
            if (width && height) {
                // 存储之前的地址
                if (!this.storeUrl) {
                    this.storeUrl = this.src;
                }
                // canvas大小
                canvas.width = width;
                canvas.height = height;
                // 绘制图片帧（第一帧）
                canvas.getContext('2d').drawImage(this, 0, 0, width, height);
                // 重置当前图片
                try {
                    this.src = canvas.toDataURL("image/gif");
                } catch (e) {
                    // 跨域
                    this.removeAttribute('src');
                    // 载入canvas元素
                    canvas.style.position = 'absolute';
                    // 前面插入图片
                    this.parentElement.insertBefore(canvas, this);
                    // 隐藏原图
                    this.style.opacity = '0';
                    // 存储canvas
                    this.storeCanvas = canvas;
                }
            }
        };
    }
    
});
