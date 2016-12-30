/**
 * Created by KangWei on 2016/12/28.
 * 2016/12/28 12:49
 * CESDemo
 */
let bracelet = {};
let packetSeq = 1;
let packets = [];
let braceletHeart;
bracelet.node = "";
bracelet.status = false;
bracelet.connect = function (mac, type) {
    apiImpl.conn({node: mac, type: type});
};

bracelet.onConnect = function (node, fnRefUi) {
    // $("#" + htmlElementId).css('background', 'green');
    fnRefUi();
    bracelet.node = node;
    bracelet.status = true;
    this.openHr();
    this.openStep();
};

bracelet.openHr = function () {
    apiImpl.write({
        node: bracelet.node,
        handle: '23',
        value: '0100'
    });
};

bracelet.openStep = function () {
    apiImpl.write({
        node: bracelet.node,
        handle: '17',
        value: '0100'
    });
    apiImpl.write({
        node: bracelet.node,
        handle: '19',
        value: 'ff2006000227',
        success: function () {
            let data = ['ff000c', getPacketSequence(), '011004010101'];
            checksum(data);
            apiImpl.write({
                node: bracelet.node,
                handle: '19',
                value: data.join(''),
                success: function () {
                    console.log(444444444444)
                }
            })
        }
    });
    
};

bracelet.notify = function (value) {
    clearInterval(braceletHeart);
    braceletHeart = setInterval(function () {
        logd('已经10秒钟没有收到手环的数据了');
        bracelet.onDisconnect();
        clearInterval(braceletHeart);
    }, 10 * SECOND_UNIT);
    if (value.length == 4) {
        $(arguments[1]).html(parseInt(value, 16));
    } else if (value.slice(14, 16) == "01" && value.slice(10, 12) == "01") {
        let stepCount = parseInt(value.slice(22, 26), 16);
        let cal = parseInt(value.slice(32, 38), 16);
        cal = parseFloat(cal * 0.1).toFixed(1);
        $(arguments[2]).html(stepCount);
        $(arguments[3]).html(cal);
    }
};

bracelet.setDisconnectListener = function (onDisconnect) {
    bracelet.onDisconnect = onDisconnect;
};

bracelet.disconnect = function (fnRefUi) {
    fnRefUi();
    apiImpl.conn.close({node: bracelet.node})
};

bracelet.sendMsg = function (msg) {
    let convertedData = encodeUtf8(msg);
    packetData(convertedData);
    for (let i = 0; i < packets.length; i++) {
        apiImpl.write({
            node: bracelet.node,
            handle: '19',
            value: packets[i].join('')
        });
        console.log(packets[i].join(''))
    }
    
    packetSeq++;
    packets = [];
};

function packetData(data) {
    let dataLength = data.length / 2;
    if (dataLength < 5) {
        let totalLen = 16 + dataLength;
        let packet = ['ff00', totalLen.toString(16), '0b', getPacketSequence(), "02100201" + '0' + (dataLength + 4).toString(16) + "0103" + '0101', data + "",];
        checksum(packet);
        packets.push(packet);
    } else {
        //多包
        setOfPackets(data, data.length, 0)
    }
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
            let contentLen = (remainder / 2 + 4).toString(16);
            contentLen = contentLen.length < 2 ? '0' + contentLen : contentLen;
            let packet = [packetHeader, identifier, getTotalLength(content.length, sequence).toString(16), getPacketSequence(), "02100201" + contentLen + "0103" + '0101', content + "",];
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
            
            wrapData();
            checksum(packet);
            packets.push(packet);
            
        }
        
        setOfPackets(data, remainder, sequence);
    }
    
}

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

function wrapData(val) {
    return val < 10 ? '0' + val : val + "";
}

function getTotalLength(datalen, sequence) {
    if (sequence === 0) {
        return 1 + 1 + 1 + 2 + 9 + parseInt(datalen / 2) + 1;
    } else {
        let len = (1 + 1 + 1 + parseInt(datalen / 2) + 1).toString(16);
        len = len.length < 2 ? '0' + len : len;
        return len;
    }
}

Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

function encodeUtf8(data) {
    // return encodeURI(data).split('%').join("")
    let val = "";
    for (let i = 0; i < data.length; i++) {
        let char = data[i];
        if (isChineseChar(char) || isFullwidthChar(char)) {
            if (val == "") {
                val = encodeURI(char).split('%').join(",");
            } else {
                val += encodeURI(char).split('%').join(",");
            }
        } else {
            if (val == "")
                val = data.charCodeAt(i).toString(16);
            else
                val += "," + data.charCodeAt(i).toString(16);
        }
    }
    
    return val.split(",").join('');
    
}

//是否含有中文（也包含日文和韩文）
function isChineseChar(str) {
    let reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
    return reg.test(str);
}
//同理，是否含有全角符号的函数
function isFullwidthChar(str) {
    let reg = /[\uFF00-\uFFEF]/;
    return reg.test(str);
}

/*function encodeUtf8(s1) {
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
 }*/
