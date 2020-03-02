/**
 * 信令服务
 */
const WebSocket = require('ws')
const wss = new WebSocket.Server({port: 8010})
const code2ws= new Map() 

console.log('WS Server Was Running....')

wss.on('connection', (ws, request) => {

    // 封装发送数据方法
    ws.sendData = (event, data) => {
        ws.send(JSON.stringify({event, data}))
    }
    ws.sendError = msg => {
        ws.sendData('error', { msg })
    }

    // 控制码生成
    let code =  Math.floor(Math.random() * (999999-100000)) + 100000

    let ip = request.connection.remoteAddress.replace('::ffff:', '')
    console.log('ip is connected', ip)

    
    code2ws.set(code, ws)  // <控制码, 客户端> 映射

    // 收到 Message 的处理逻辑
    ws.on('message', (message) => {
        console.log('imcoming message')

        let parsedMeaasge = {}

        try {
            parsedMeaasge = JSON.parse(message)
        } catch(e) {
            console.log('parse message error', e)
            ws.sendError('message invalid')
            return 
        }

        let { event, data } = parsedMeaasge
    
        switch(event) {
            // 登录
            case 'login':
                ws.sendData('logined', {code})
                break;
            // 控制
            case 'control':
                let remote = +data.remote
                if (code2ws.has(remote)) {
                    ws.sendData('controlled', { remote })
                    ws.sendRemote = code2ws.get(remote).sendData
                    ws.sendRemote('be-controlled', { remote: code })
                }
                break;
            // 转发
            case 'forward':
                ws.sendRemote(data.event, data.data)
                break;
            default:
                break;
        }
    })

    // 关闭事件
    ws.on('cloese', () => {
        code2ws.delete(code)
        clearTimeout(ws._closeTimeout)
    })

    ws._closeTimeout = setTimeout(() => {
        ws.terminate()
    }, 10 * 60 * 1000)
})