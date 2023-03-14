// const { loginQQBot, QQBotClient } = require('./QQBot');
// const { openaiClient } = require('./ChatGPT')
// const { app } = require('./expressPort')
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import lodash from 'lodash';
import { openaiClient } from './ChatGPT.js';
import { app } from './expressPort.js';
import { loginQQBot, QQBotClient } from './QQBot.js';
dotenv.config();
const keyWord = '哇啦'


const handleWebhook = () => {
    app.post('/gitlab_pipeline', (req, res) => {
        const data = req.body
        console.log(req.body)
        if (!['pending', 'running'].includes(data.object_attributes.detailed_status)) {
            const msg = `${data.user.name} ${data.project.name} ${data.object_attributes.ref} ${data.object_attributes.detailed_status}
${data.commit.message?.trim()}
${data.project.web_url}/-/pipelines
${dayjs(data.object_attributes.created_at).add(8, 'hour').format('MM-DD HH:mm')}
`
            QQBotClient.pickFriend(270692377).sendMsg(msg)
        }
        res.send('ok')
    })
    app.post('/gitlab_issues', (req, res) => {
        const data = req.body
        console.log(req.body)
        const msg = `🐛【${data.object_attributes.state}】${data.object_attributes.title} 
${data.object_attributes.url}
`
        QQBotClient.pickFriend(270692377).sendMsg(msg)
        res.send('ok')
    })
}

const handleGroupMsg = () => {
    QQBotClient.on('message.group', async (e) => {

        const group = QQBotClient.pickGroup(e.group_id)
        const chatHistory = await group.getChatHistory(e.seq, 100)
        const chatChain = []
        lodash.forEachRight(chatHistory, (item) => {
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
        if (toSendContent.includes('和我说')) {
            const tts = toSendContent.replace('和我说', '')
            await exec(`python3 /node/python/MoeGoe.py -t ${tts}`)
            await exec(`/usr/local/ffmpeg-5.1.1-i686-static/ffmpeg -i /node/python/model/77_2.wav -c:a libopencore_amrnb -ac 1 -ar 8000 -b:a 7.95k -y /node/python/model/77_2.amr`)
            e.reply(segment.record('/node/python/model/77_2.amr'))
        }


        if (toSendContent.includes('设定指令:')) {
            instruction = toSendContent.replace('设定指令:', '')
            process.env.instruction = instruction
            return

        }
        if (toSendContent.includes('查询指令。')) {
            e.reply(process.env.instruction)
            return
        }
        if (toSendContent.includes(keyWord)) {
            try {
                console.log('-----------------消息发出-----------------')
                console.log('messages', [
                    { role: 'system', content: process.env.instruction },
                    ...chatChain.map(item => ({
                        role: item.user_id === process.env.bot_qq ? 'assistant' : 'user', content: item.message.find(
                            (item) => item.type === 'text'
                        ).text?.replace(keyWord, '') || item.raw_message?.replace(keyWord, ''),
                    }))
                ])
                console.log('-----------------消息结束-----------------')
                const messages = [
                    { role: 'system', content: process.env.instruction },
                    ...chatChain.map(item => ({
                        role: item.user_id === process.env.bot_qq ? 'assistant' : 'user', content: item.message.find(
                            (item) => item.type === 'text'
                        ).text || item.raw_message,
                    }))
                ]
                const completion = await openaiClient.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: messages

                }).catch((e) => {
                    throw e;
                });
                e.reply((completion.data.choices[0].message.content.replace(/^\n\n/, '') || '(Empty)'), true)

            } catch (err) {
                console.log(err)
                e.reply('机器人又出错了~', true)
            }
        }
    })
}
const init = () => {
    loginQQBot()
    handleGroupMsg()
    handleWebhook()
}
init()
console.log('cwd       : ' + process.cwd())
