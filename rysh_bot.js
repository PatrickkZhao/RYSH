const { createClient } = require('icqq')
const { ChatGPTAPI } = require('openai')
const { Configuration, OpenAIApi } = require("openai");
const { forEachRight } = require('lodash');
require('dotenv').config();


const init = () => {
    const openai_key = process.env.openai_key
    const bot_qq = process.env.bot_qq
    const bot_psw = process.env.bot_psw

    const configuration = new Configuration({
        apiKey: openai_key,
    });
    const openai = new OpenAIApi(configuration);





    const client = createClient({ platform: 5 })
    const account = Number(bot_qq)
    const password = bot_psw


    client.on('system.login.slider', (e) => {
        console.log('输入滑块地址获取的ticket后继续。\n滑块地址:    ' + e.url)
        process.stdin.once('data', (data) => {
            client.submitSlider(data.toString().trim())
        })
    })
    client.on('system.login.qrcode', (e) => {
        console.log('扫码完成后回车继续:    ')
        process.stdin.once('data', () => {
            client.login()
        })
    })
    client.on('system.login.device', (e) => {
        console.log('请选择验证方式:(1：短信验证   其他：扫码验证)')
        process.stdin.once('data', (data) => {
            if (data.toString().trim() === '1') {
                client.sendSmsCode()
                console.log('请输入手机收到的短信验证码:')
                process.stdin.once('data', (res) => {
                    client.submitSmsCode(res.toString().trim())
                })
            } else {
                console.log('扫码完成后回车继续：' + e.url)
                process.stdin.once('data', () => {
                    client.login()
                })
            }
        })
    })
    client.on('system.login.error', (e) => { })

    client.on('message.group', async (e) => {

        const group = client.pickGroup(e.group_id)
        const chatHistory = await group.getChatHistory(e.seq, 50)
        const chatChain = []
        forEachRight(chatHistory, (item) => {
            if (
                item.seq === e.seq ||
                item.seq === e.source?.seq ||
                item.seq === chatChain[0]?.source?.seq
            ) {
                chatChain.unshift(item)
            }
        })
        const toSendContent = chatChain
            .map((item) => {
                const text =
                    (
                        item.message.find(
                            (item) => item.type === 'text'
                        )
                    )?.text || item.raw_message
                return text.trim()
            })
            .join('\n')
        console.log('toSendContent', toSendContent)
        if (toSendContent.includes('哇啦')) {
            try {
                console.log('-----------------消息发出-----------------')
                console.log('messages', [
                    { role: 'system', 'content': '你是一个 AI 助手' },
                    ...chatChain.map(item => ({
                        role: item.user_id === 270692377 ? 'assistant' : 'user', content: item.message.find(
                            (item) => item.type === 'text'
                        ).text || item.raw_message,
                    }))
                ])
                console.log('-----------------消息结束-----------------')

                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: 'system', 'content': '你是一个 AI 助手' },
                        ...chatChain.map(item => ({
                            role: item.user_id === 270692377 ? 'assistant' : 'user', content: item.message.find(
                                (item) => item.type === 'text'
                            ).text || item.raw_message,
                        }))
                    ]

                }).catch((e) => {
                    throw e;
                });
                e.reply(completion.data.choices[0].message.content.replace(/^\n\n/, '') || '(Empty)', true)
            } catch (err) {
                console.log(err)
                e.reply('机器人又出错了~', true)
            }
        }
    })
    client.login(account, password)
}
init()