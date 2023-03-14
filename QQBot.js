// const { createClient, segment } = require('icqq')
// const { forEachRight } = require('lodash');
import { createClient } from 'icqq'
export const QQBotClient = createClient({ platform: 5 })

export const loginQQBot = () => {
    const account = Number(process.env.bot_qq)
    const password = process.env.bot_psw
    QQBotClient.on('system.login.slider', (e) => {
        console.log('输入滑块地址获取的ticket后继续。\n滑块地址:    ' + e.url)
        process.stdin.once('data', (data) => {
            QQBotClient.submitSlider(data.toString().trim())
        })
    })
    QQBotClient.on('system.login.qrcode', (e) => {
        console.log('扫码完成后回车继续:    ')
        process.stdin.once('data', () => {
            QQBotClient.login()
        })
    })
    QQBotClient.on('system.login.device', (e) => {
        console.log('请选择验证方式:(1：短信验证   其他：扫码验证)')
        process.stdin.once('data', (data) => {
            if (data.toString().trim() === '1') {
                QQBotClient.sendSmsCode()
                console.log('请输入手机收到的短信验证码:')
                process.stdin.once('data', (res) => {
                    QQBotClient.submitSmsCode(res.toString().trim())
                })
            } else {
                console.log('扫码完成后回车继续：' + e.url)
                process.stdin.once('data', () => {
                    QQBotClient.login()
                })
            }
        })
    })
    QQBotClient.login(account, password)
}


