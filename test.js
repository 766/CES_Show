/**
 * Created by KangWei on 2016/12/21.
 * 2016/12/21 14:39
 * CESDemo
 */
(function (G) {
    let api = {}
    let __es = function (target, url, fn) {
        let es = target.es = new EventSource(String(url));
        es.onmessage = function (event) {
            fn && fn(event)
        }
    }
    __es.close = function (target) {
        let es = target.es;
        if (es && es.onmessage) {
            es.close(), es = es.onmessage = null, delete es
        }
    }
    
    api.use = function (o) {
        o = o || {}
        let reg_ip = /(\d+)\.(\d+)\.(\d+)\.(\d+)/,
            reg_http = /http\:\/\/(.+)/;
        // local
        if (o.server && typeof o.server == 'string' && o.server.match(reg_ip)) {
            api.server = 'http://' + o.server
            api.local = true
            // cloud
        } else if (o.server && typeof o.server == 'string' && o.server.match(reg_http)) {
            // ... hehe, use url directly
            // cloud (use us/cn/auto)
        } else {
            api.server = 'http://' + ({
                    'us': 'api1',
                    'cn': 'api2',
                    'demo': 'demo',
                    'auto': 'api'
                }[o.server] || 'api') + '.cassianetworks.com'
        }
        api.developer = o.developer || 'tester'
        api.key = o.key || '10b83f9a2e823c47'
        api.base64_dev_key = 'Basic ' + btoa(o.developer + ':' + o.key)
        api.hub = o.hub
        return api
    }
    api.oauth2 = function (o) {
        o = o || {}
        let next = function (d) {
            api.access_token = d || '',
                api.authorization = 'Bearer ' + (d || ''),
            o.success && o.success(d),
                api.trigger('oauth2', [d])
        }
        if (api.local) {
            next()
        } else {
            $.ajax({
                type: 'post',
                url: api.server + '/oauth2/token',
                headers: {'Authorization': api.base64_dev_key},
                data: {"grant_type": "client_credentials"},
                success: function (data) {
                    next(data.access_token)
                }
            })
        }
        return api
    }
    api.on = function (e, fn) {
        api.on[e] = fn
        if (e == 'notify') {
            api.notify(true)
        }
        return api
    }
    api.off = function (e) {
        api.on[e] = null
        delete api.on[e]
        if (e == 'notify') {
            api.notify(false)
        }
        return api
    }
    api.trigger = function (e, args) {
        api.on[e] && (typeof api.on[e] == 'function') && (api.on[e].apply(api, args))
        return api
    }
    
    api.scan = function (chip) {
        __es(api.scan, api.server + '/gap/nodes/?event=1&mac=' + api.hub + '&chip=' + (chip || 1) + '&access_token=' + api.access_token,
            function (event) {
                api.trigger('scan', [api.hub, event.data])
            });
        return api
    };
    api.scan.close = function () {
        __es.close(api.scan)
        return api
    };
    api.conn = function (o) {
        o = o || {}
        $.ajax({
            type: 'post',
            url: api.server + '/gap/nodes/' + o.node + '/connection?mac=' + (o.hub || api.hub),
            headers: api.local ? '' : {'Authorization': api.authorization},
            data: {
                "type": o.type || "public"
            },
            success: function (data) {
                console.log(data)
                o.success && o.success(o.hub || api.hub, o.node, data)
                api.trigger('conn', [o.hub || api.hub, o.node, data])
            }
        })
        return api
    }
    api.conn.close = function (o) {
        o = o || {}
        $.ajax({
            type: 'delete',
            url: api.server + '/gap/nodes/' + o.node + '/connection?mac=' + (o.hub || api.hub),
            headers: api.local ? '' : {'Authorization': api.authorization},
            success: function (data) {
                console.log(data)
                o.success && o.success(o.hub || api.hub, o.node, data)
                api.trigger('conn.close', [o.hub || api.hub, o.node, data])
            }
        })
        return api
    }
    
    api.devices = function (o) {
        o = o || {}
        $.ajax({
            type: 'get',
            url: api.server + '/gap/nodes/?connection_state=connected&mac=' + (o.hub || api.hub),
            headers: api.local ? '' : {'Authorization': api.authorization},
            success: function (data) {
                console.log(data)
                o.success && o.success(data)
            }
        })
        return api
    }
    
    api.discover = function (o) {
        o = o || {}
        $.ajax({
            type: 'get',
            url: api.server + '/gatt/nodes/' + o.node + '/services/characteristics/descriptors?mac=' + (o.hub || api.hub),
            headers: api.local ? '' : {'Authorization': api.authorization},
            success: function (data) {
                console.log(data)
                o.success && o.success(data)
            }
        })
        return api
    }
    
    api.write = function (o) {
        o = o || {}
        $.ajax({
            type: 'get',
            url: api.server + '/gatt/nodes/' + o.node + '/handle/' + o.handle + '/value/' + o.value + '/?mac=' + (o.hub || api.hub),
            // headers: {'Authorization': api.authorization},
            success: function (data) {
                o.success && o.success(data)
            }
        })
        return api
    }
    
    api.read = function (o) {
        o = o || {}
        $.ajax({
            type: 'get',
            url: api.server + '/gatt/nodes/' + o.node + '/handle/' + o.handle + '/value/?mac=' + (o.hub || api.hub),
            headers: {'Authorization': api.authorization},
            success: function (data) {
                o.success && o.success(data)
            }
        })
        return api
    }
    
    api.notify = function (toggle) {
        if (toggle) {
            __es(api.notify, api.server + '/gatt/nodes/?event=1&mac=' + api.hub + '&access_token=' + api.access_token,
                function (event) {
                    api.trigger('notify', [api.hub, event.data])
                })
        } else {
            __es.close(api.notify)
        }
    }
    
    G.api = api
})(this);


let hub_state_connecting = false;
let apiImpl;
function isConnected(mac) {
    return connectedDev.indexOf(mac) > -1;
}

function isContains(str, substr) {
    return str.toLowerCase().indexOf(substr) >= 0;
}


function getHR() {
    apiImpl.scan()
        .on('scan', function (hub, data) {
            if (isContains(data, 'keep-alive')) {
                return;
            }
            let devInfo = JSON.parse(data);
            // let mac = devInfo.bdaddrs[0].bdaddr;
            // let type = devInfo.bdaddrs[0].bdaddrType;
            if (isContains(devInfo.name, 'h603b')) {
                let hrData = devInfo.adData
                console.log(hrData)
                let hr = hrData.substr(hrData.length - 2, 2);
                $('#hr').val(hr)
            }
            
        })
}

function startScan() {
    console.log('scan clicked');
    apiImpl
        .scan()
        .on('scan', function (hub, data) {
            // console.log(hub, data);
            if (isContains(data, 'keep-alive')) {
                return;
            }
            
            let devInfo = JSON.parse(data);
            let mac = devInfo.bdaddrs[0].bdaddr;
            let type = devInfo.bdaddrs[0].bdaddrType;
            
            if (isContains(devInfo.name, 'h603b')) {
                let hrData = devInfo.adData;
                console.log(hrData);
                let hr = hrData.substr(hrData.length - 2, 2);
                $('#hr1').val(parseInt(hr, 16))
            } else {
                if (!hub_state_connecting) {
                    // || isContains(devInfo.name, 'h603b')
                    if (isContains(devInfo.name, 'hw330') || isContains(devInfo.name, 'sr428')) {
                        console.log('find matched dev :' + "name :" + devInfo.name + "mac :" + mac);
                        hub_state_connecting = true;
                        setTimeout(function () {
                            console.log('timer task exe');
                            hub_state_connecting = false;
                        }, 20000);
                        
                        api.conn({node: mac, type: type})
                            .on('conn', function (hub, node, data) {
                                console.log('conn!', data);
                                hub_state_connecting = true;
                                if (isContains(devInfo.name, 'hw330')) {
                                    api.write({
                                        node: node,
                                        handle: '23',
                                        value: '0100'
                                    })
                                } else if (isContains(devInfo.name, 'sr428')) {
                                    api.write({
                                        node: node,
                                        handle: '27',
                                        value: '0100'
                                    })
                                }
                                
                                
                                // api.write({
                                //     node: node,
                                //     handle: '27',
                                //     value: '0100'
                                // })
                            })
                            .on('notify', function (hub, data) {
                                console.log('notification is:', data);
                                // $('#F0:9F:12:96:A0:AF'.replace(/:/g, '')).text(data);
                                // let hexHr = JSON.parse(data).value;
                                // content.append("<span> hr :" + parseInt(hexHr, 16) + "</span></br>");
                                if (isContains(data, 'keep-alive'))return;
                                let dataObj = JSON.parse(data)
                                switch (dataObj.id) {
                                    case 'E9:14:DD:A4:C2:9C':
                                        $("#hr2").val(parseInt(data.value, 16));
                                        break;
                                    default:
                                        $("#jump").val(parseInt(data.value, 16));
                                }
                            });
                    }
                }
            }
        });
    
    
}

function config() {
    let hubIp = $('#hub_ip').val();
    let hubMac = $('#hub_mac').val();
    apiImpl = api.use({
        server: hubIp || '192.168.0.109',
        hub: hubMac || 'CC:1B:E0:E0:1B:00'
    });
    
    console.log('config success!  hubip :' + hubIp + " hubMac :" + hubMac)
}

function stopScan() {
    apiImpl.scan.close();
}

function getConnectedDev() {
    apiImpl.devices()
}

function disconnectDev() {
    //node: 'C0:77:19:AA:5D:B2' //手环
    // node:"E9:14:DD:A4:C2:9C" //手环新
    // node:"D0:BF:58:A8:5A:4D" //跳绳
    // node:"FE:2E:F1:3A:35:F4" //心率带
    // apiImpl.conn.close({node: 'C0:77:19:AA:5D:B2'})
    apiImpl.conn.close({node: "E9:14:DD:A4:C2:9C"})
    // conn.close({node: 'FE:2E:F1:3A:35:F4'})
    // FE:2E:F1:3A:35:F4
}

function getHandle() {
    apiImpl.discover({node: 'FB:10:FD:E6:93:03'})
}

function checksum(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item.length <= 2) {
            sum += parseInt(item, 16);
        } else {
            let count = 0;
            if (item.length % 2 == 0) {
                count = item.length / 2;
            } else {
                count = parseInt(item.length / 2) + 1;
            }
            
            let pos = 0;
            for (let j = 0; j < count; j++) {
                sum += parseInt(item.slice(pos, pos += 2), 16);
            }
        }
    }
    
    sum %= 0x100;
    
    let checksum = sum.toString(16);
    checksum = checksum.length < 2 ? '0' + checksum : checksum;
    
    data.insert(data.length, checksum);
}

let packets = [];

function getTotalLength(datalen, sequence) {
    if (sequence === 0) {
        return 1 + 1 + 1 + 2 + 9 + parseInt(datalen / 2) + 1;
    } else {
        let len = (1 + 1 + 1 + parseInt(datalen / 2) + 1).toString(16);
        len = len.length < 2 ? '0' + len : len;
        return len;
    }
}

let packetSeq = 0;

function getPacketSequence() {
    let packetSeqS;
    if (packetSeq > 10 && packetSeq < 99) {
        packetSeqS = '00' + packetSeq;
    } else if (packetSeq > 99) {
        packetSeqS = '0' + packetSeq;
    } else {
        packetSeqS = '000' + packetSeq;
    }
    
    return packetSeqS;
}

function wrapData(val) {
    return val < 10 ? '0' + val : val + "";
}

/**
 *组包
 * @param data
 * @param remainder
 * @param sequence
 */
function setOfPackets(data, remainder, sequence) {
    function getTimestamp() {
        let date = new Date();
        return wrapData(date.getHours()) + wrapData(date.getMinutes());
    }
    
    if (sequence >= 0) {
        let x = 0b10000000 + sequence;
        let identifier = x.toString(16);
        let packetHeader = 'ff';
        if (sequence == 0) {
            let content = data.slice(0, 10);
            let packet = [packetHeader, identifier, getTotalLength(content.length, sequence).toString(16), getPacketSequence(), "02100201" + (remainder / 2 + 4).toString(16) + "0103" + '0101', content + "",];
            checksum(packet);
            remainder -= 10;
            sequence += 1;
            packets.push(packet);
        } else {
            let content;
            if (remainder <= 32) {
                x = 0b11000000 + sequence;
                identifier = x.toString(16);
                content = data.substr((sequence - 1) * 32 + 10, 32);
                sequence = -1;
            } else {
                remainder -= 32;
                content = data.substr((sequence - 1) * 32 + 10, 32);
                sequence += 1;
            }
            
            let packet = [packetHeader, identifier, getTotalLength(content.length, sequence).toString(16), content];
            
            wrapData()
            checksum(packet);
            packets.push(packet);
            
        }
        
        setOfPackets(data, remainder, sequence);
    }
    
}

function packetData(data) {
    let dataLength = data.length / 2;
    if (dataLength < 5) {
        //TODO 单包
    } else {
        //多包
        setOfPackets(data, data.length, 0)
        
    }
}

function send() {
    let content = $('#content').val();
    let dev_mac = $('#dev_mac').val();
    let convertedData = encodeUtf8(content);
    packetData(convertedData);
    console.log(content + "---------> utf-8: " + convertedData);
    // packets.push(['ff', '80', '14', '0016', '021002012501030101', 'e5b08fe698', '8b']);
    // packets.push(['ff', '81', '14', '8ee5908ce5ada6e588b0e88081e5b888', '86']);
    // packets.push(['ff', 'c2', '10', 'e58a9ee585ace5aea4e69da5', '53']);
    // node:"E9:14:DD:A4:C2:9C"
    // node:"C0:77:19:AA:5D:B2"
    for (let i = 0; i < packets.length; i++) {
        apiImpl.write({
            node: dev_mac || "E9:14:DD:A4:C2:9C",
            handle: '19',
            value: packets[i].join('')
        })
        
        console.log(packets[i].join(''))
    }
    
    packetSeq++;
    packets = [];
    
}


Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

function encodeUtf8(s1) {
    let s = escape(s1);
    let sa = s.split("%");
    let retV = "";
    if (sa[0] != "") {
        retV = sa[0];
    }
    for (let i = 1; i < sa.length; i++) {
        if (sa[i].substring(0, 1) == "u") {
            retV += hex2Utf8(str2Hex(sa[i].substring(1, 5)));
            
        }
        else retV += "%" + sa[i];
    }
    
    let str = retV.split('%');
    return str.join("")
}

function str2Hex(s) {
    let c = "";
    let n;
    let ss = "0123456789ABCDEF";
    let digS = "";
    for (let i = 0; i < s.length; i++) {
        c = s.charAt(i);
        n = ss.indexOf(c);
        digS += dec2Dig(eval(n));
        
    }
    //return value;
    return digS;
}

function dec2Dig(n1) {
    let s = "";
    let n2 = 0;
    for (let i = 0; i < 4; i++) {
        n2 = Math.pow(2, 3 - i);
        if (n1 >= n2) {
            s += '1';
            n1 = n1 - n2;
        }
        else
            s += '0';
        
    }
    return s;
    
}

function dig2Dec(s) {
    let retV = 0;
    if (s.length == 4) {
        for (let i = 0; i < 4; i++) {
            retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
        }
        return retV;
    }
    return -1;
}

function hex2Utf8(s) {
    let retS = "";
    let tempS = "";
    let ss = "";
    if (s.length == 16) {
        tempS = "1110" + s.substring(0, 4);
        tempS += "10" + s.substring(4, 10);
        tempS += "10" + s.substring(10, 16);
        let sss = "0123456789ABCDEF";
        for (let i = 0; i < 3; i++) {
            retS += "%";
            ss = tempS.substring(i * 8, (eval(i) + 1) * 8);
            
            
            retS += sss.charAt(dig2Dec(ss.substring(0, 4)));
            retS += sss.charAt(dig2Dec(ss.substring(4, 8)));
        }
        return retS;
    }
    return "";
}
