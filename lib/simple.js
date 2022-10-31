// TODO: Make this file more redeable
/**
[ https://github.com/NeKosmic/ ]
**/
import path from 'path'
import { toAudio } from './converter.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import util from 'util'
import { fileTypeFromBuffer } from 'file-type'
import { format } from 'util'
import { fileURLToPath } from 'url'
import Connection from './connection.js'
import axios from 'axios'
import moment from 'moment-timezone'
import jimp from 'jimp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('@adiwajshing/baileys')} */
const {
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    extractMessageContent,
    getContentType
} = (await import('@adiwajshing/baileys')).default

/** @param {import('./connection').Socket} conn */
export function HelperConnection(conn, options = {}) {
    const botUser = conn.user || {}
    /** @type {import('@adiwajshing/baileys').WASocket | import('@adiwajshing/baileys').WALegacySocket} */
    let sock = Object.defineProperties(conn, {
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null
                return jid?.decodeJid?.()
            }, configurable: true
        },
        logger: {
            value: {
                info(...args) {
                    console.log(
                        chalk.bold.bgRgb(51, 204, 51)('INFO '+Intl.DateTimeFormat().resolvedOptions().timeZone),
                        `[${chalk.rgb(255, 255, 255)(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('DD/MM/YY HH:mm:ss'))}]:`,
                        chalk.cyan(format(...args))
                    )
                },
                error(...args) {
                    console.log(
                        chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                        `[${chalk.rgb(255, 255, 255)(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('DD/MM/YY HH:mm:ss'))}]:`,
                        chalk.rgb(255, 38, 0)(format(...args))
                    )
                },
                warn(...args) {
                    console.log(
                        chalk.bold.bgRgb(255, 153, 0)('AVISO '),
                        `[${chalk.rgb(255, 255, 255)(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('DD/MM/YY HH:mm:ss'))}]:`,
                        chalk.redBright(format(...args))
                    )
                },
                trace(...args) {
                    console.log(
                        chalk.grey('RASTRO '),
                        `[${chalk.rgb(255, 255, 255)(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('DD/MM/YY HH:mm:ss'))}]:`,
                        chalk.white(format(...args))
                    )
                },
                debug(...args) {
                    console.log(
                        chalk.bold.bgRgb(66, 167, 245)('DEPURAR '),
                        `[${chalk.rgb(255, 255, 255)(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('DD/MM/YY HH:mm:ss'))}]:`,
                        chalk.white(format(...args))
                    )
                }
            },
            enumerable: true,
            writable: true,
        },
        getFile: {
            /**
             * getBuffer hehe
             * @param {fs.PathLike} PATH 
             * @param {Boolean} saveToFile
             */
            async value(PATH, saveToFile = false) {
                let res, filename
                const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? PATH.toBuffer() : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
                const type = await fileTypeFromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                }
                if (data && saveToFile && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs.promises.unlink(filename)
                    }
                }
            },
            enumerable: true,
            writable: true,
        },
        // waitEvent: {
        //     /**
        //      * waitEvent
        //      * @param {String} eventName 
        //      * @param {Boolean} is 
        //      * @param {Number} maxTries 
        //      */
        //     value(eventName, is = () => true, maxTries = 25) { //Idk why this exist?
        //         return new Promise((resolve, reject) => {
        //             let tries = 0
        //             let on = (...args) => {
        //                 if (++tries > maxTries) reject('Max tries reached')
        //                 else if (is()) {
        //                     conn.ev.off(eventName, on)
        //                     resolve(...args)
        //                 }
        //             }
        //             conn.ev.on(eventName, on)
        //         })
        //     }
        // },
        sendFile: {
            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid
             * @param {String|Buffer} path
             * @param {String} filename
             * @param {String} caption
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Boolean} ptt
             * @param {Object} options
             */
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await conn.getFile(path, true)
                let { res, data: file, filename: pathFile } = type
                if (res && res.status !== 200 || file.length <= 65536) {
                    try { throw { json: JSON.parse(file.toString()) } }
                    catch (e) { if (e.json) throw e.json }
                }
                const fileSize = fs.statSync(pathFile).size / 1024 / 1024
                if (fileSize >= 20000) throw new Error('\n[!] El tamaño del archivo es demasiado grande!\n')
                let opt = {}
                if (quoted) opt.quoted = quoted
                if (!type) options.asDocument = true
                let mtype = '', mimetype = options.mimetype || type.mime, convert
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
                else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
                else if (/video/.test(type.mime)) mtype = 'video'
                else if (/audio/.test(type.mime)) (
                    convert = await toAudio(file, type.ext),
                    file = convert.data,
                    pathFile = convert.filename,
                    mtype = 'audio',
                    mimetype = options.mimetype || 'audio/ogg; codecs=opus'
                )
                else mtype = 'document'
                if (options.asDocument) mtype = 'document'

                delete options.asSticker
                delete options.asLocation
                delete options.asVideo
                delete options.asDocument
                delete options.asImage

                let message = {
                    ...options,
                    caption,
                    ptt,
                    [mtype]: { url: pathFile },
                    mimetype,
                    fileName: filename || pathFile.split('/').pop()
                }
                /**
                 * @type {import('@adiwajshing/baileys').proto.WebMessageInfo}
                 */
                let m
                try {
                    m = await conn.sendMessage(jid, message, { ...opt, ...options })
                } catch (e) {
                    console.error(e)
                    m = null
                } finally {
                    if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
                    file = null // releasing the memory
                    return m
                }
            },
            enumerable: true,
            writable: true,
        },
        sendContact: {
            /**
             * Send Contact
             * @param {String} jid 
             * @param {String[][]|String[]} data
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted 
             * @param {Object} options 
             */
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                let contacts = []
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '')
                    let njid = number + '@s.whatsapp.net'
                    let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
X-WA-BIZ-NAME:${(Connection.store.getContact(njid)?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD
        `.trim()
                    contacts.push({ vcard, displayName: name })

                }
                return await conn.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, { quoted, ...options })
            },
            enumerable: true,
            writable: true,
        },
        reply: {
            /**
             * Reply to a message
             * @param {String} jid
             * @param {String|Buffer} text
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            value(jid, text = '', quoted, options) {
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
            },
            writable: true,
        },
        // TODO: Fix sendLocation
        // Maybe aploud buffer to whatsapp first and then send location
        sendButton: {
            /**
             * send Button
             * @param {String} jid
             * @param {String} text
             * @param {String} footer
             * @param {Buffer} buffer
             * @param {String[] | String[][]} buttons
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, text = '', footer = '', buffer, buttons, quoted, options) {
                let type
                if (Array.isArray(buffer)) (options = quoted, quoted = buttons, buttons = buffer, buffer = null)
                else if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = null }
                if (!Array.isArray(buttons[0]) && typeof buttons[0] === 'string') buttons = [buttons]
                if (!options) options = {}
                let message = {
                    ...options,
                    [buffer ? 'caption' : 'text']: text || '',
                    footer,
                    buttons: buttons.map(btn => ({
                        buttonId: !nullish(btn[1]) && btn[1] || !nullish(btn[0]) && btn[0] || '',
                        buttonText: {
                            displayText: !nullish(btn[0]) && btn[0] || !nullish(btn[1]) && btn[1] || ''
                        }
                    })),
                    ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: buffer
                            }
                        } : {
                            [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer
                        } : {})
                }

                return await conn.sendMessage(jid, message, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            },
            enumerable: true,
            writable: true,
        },
        sendHydrated: {
            /**
             * 
             * @param {String} jid 
             * @param {String} text 
             * @param {String} footer 
             * @param {fs.PathLike} buffer
             * @param {String|string[]} url
             * @param {String|string[]} urlText
             * @param {String|string[]} call
             * @param {String|string[]} callText
             * @param {String[][]} buttons
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, text = '', footer = '', buffer, url, urlText, call, callText, buttons, quoted, options) {
                let type
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null)
                if (!options) options = {}
                let templateButtons = []
                if (url || urlText) {
                    if (!Array.isArray(url)) url = [url]
                    if (!Array.isArray(urlText)) urlText = [urlText]
                    templateButtons.push(...(
                        url.map((v, i) => [v, urlText[i]])
                            .map(([url, urlText], i) => ({
                                index: templateButtons.length + i + 1,
                                urlButton: {
                                    displayText: !nullish(urlText) && urlText || !nullish(url) && url || '',
                                    url: !nullish(url) && url || !nullish(urlText) && urlText || ''
                                }
                            })) || []
                    ))
                }
                if (call || callText) {
                    if (!Array.isArray(call)) call = [call]
                    if (!Array.isArray(callText)) callText = [callText]
                    templateButtons.push(...(
                        call.map((v, i) => [v, callText[i]])
                            .map(([call, callText], i) => ({
                                index: templateButtons.length + i + 1,
                                callButton: {
                                    displayText: !nullish(callText) && callText || !nullish(call) && call || '',
                                    phoneNumber: !nullish(call) && call || !nullish(callText) && callText || ''
                                }
                            })) || []
                    ))
                }
                if (buttons.length) {
                    if (!Array.isArray(buttons[0])) buttons = [buttons]
                    templateButtons.push(...(
                        buttons.map(([text, id], index) => ({
                            index: templateButtons.length + index + 1,
                            quickReplyButton: {
                                displayText: !nullish(text) && text || !nullish(id) && id || '',
                                id: !nullish(id) && id || !nullish(text) && text || ''
                            }
                        })) || []
                    ))
                }
                let message = {
                    ...options,
                    [buffer ? 'caption' : 'text']: text || '',
                    footer,
                    templateButtons,
                    ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: buffer
                            }
                        } : {
                            [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer
                        } : {})
                }
                return await conn.sendMessage(jid, message, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            },
            enumerable: true,
            writable: true,
        },
        sendPoll: {
            async value(jid, name = '', optiPoll, options) {
                if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === 'string') optiPoll = [optiPoll]
                if (!options) options = {}
                const pollMessage = {
        name: name,
        options: optiPoll.map(btn => ({
                            optionName: !nullish(btn[0]) && btn[0] || ''
                    })),
                    selectableOptionsCount: 1
        }
                return conn.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...options });
                }
        },
        sendList: {
            async value(jid, title, text, footer, buttonText, buffer, listSections, quoted, options) {
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = listSections, listSections = buffer, buffer = null)
                if (!options) options = {}
                // send a list message!
                const sections = listSections.map(([title, rows]) => ({
                    title: !nullish(title) && title || !nullish(rowTitle) && rowTitle || '',
                    rows: rows.map(([rowTitle, rowId, description]) => ({
                        title: !nullish(rowTitle) && rowTitle || !nullish(rowId) && rowId || '',
                        rowId: !nullish(rowId) && rowId || !nullish(rowTitle) && rowTitle || '',
                        description: !nullish(description) && description || ''
                    }))
                }))

                const listMessage = {
                    text,
                    footer,
                    title,
                    buttonText,
                    sections
                }
                return await conn.sendMessage(jid, listMessage, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            }
        },
        cMod: {
            /**
             * cMod
             * @param {String} jid 
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} message 
             * @param {String} text 
             * @param {String} sender 
             * @param {*} options 
             * @returns 
             */
            value(jid, message, text = '', sender = conn.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
                let copy = message.toJSON()
                delete copy.message.messageContextInfo
                delete copy.message.senderKeyDistributionMessage
                let mtype = Object.keys(copy.message)[0]
                let msg = copy.message
                let content = msg[mtype]
                if (typeof content === 'string') msg[mtype] = text || content
                else if (content.caption) content.caption = text || content.caption
                else if (content.text) content.text = text || content.text
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options }
                    msg[mtype].contextInfo = {
                        ...(content.contextInfo || {}),
                        mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                    }
                }
                if (copy.participant) sender = copy.participant = sender || copy.participant
                else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
                if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
                else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
                copy.key.remoteJid = jid
                copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
                return proto.WebMessageInfo.fromObject(copy)
            },
            enumerable: true,
            writable: true,
        },
        copyNForward: {
            /**
             * Exact Copy Forward
             * @param {String} jid
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} message
             * @param {Boolean|Number} forwardingScore
             * @param {Object} options
             */
            async value(jid, message, forwardingScore = true, options = {}) {
                let vtype
                if (options.readViewOnce && message.message.viewOnceMessage?.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0]
                    delete message.message.viewOnceMessage.message[vtype].viewOnce
                    message.message = proto.Message.fromObject(
                        JSON.parse(JSON.stringify(message.message.viewOnceMessage.message))
                    )
                    message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
                }
                let mtype = getContentType(message.message)
                let m = generateForwardMessageContent(message, !!forwardingScore)
                let ctype = getContentType(m)
                if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore
                m[ctype].contextInfo = {
                    ...(message.message[mtype].contextInfo || {}),
                    ...(m[ctype].contextInfo || {})
                }
                m = generateWAMessageFromContent(jid, m, {
                    ...options,
                    userJid: conn.user.jid
                })
                await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
                return m
            },
            enumerable: true,
            writable: true,
        },
        fakeReply: {
            /**
             * Fake Replies
             * @param {String} jid
             * @param {String|Object} text
             * @param {String} fakeJid
             * @param {String} fakeText
             * @param {String} fakeGroupJid
             * @param {String} options
             */
            value(jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) {
                return conn.reply(jid, text, { key: { fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }, ...options })
            },
            writable: true,
        },
        downloadM: {
            /**
             * Download media message
             * @param {Object} m
             * @param {String} type
             * @param {fs.PathLike | fs.promises.FileHandle} saveToFile
             * @returns {Promise<fs.PathLike | fs.promises.FileHandle | Buffer>}
             */
            async value(m, type, saveToFile) {
                let filename
                if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
                const stream = await downloadContentFromMessage(m, type)
                let buffer = Buffer.from([])
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }
                if (saveToFile) ({ filename } = await conn.getFile(buffer, true))
                return saveToFile && fs.existsSync(filename) ? filename : buffer
            },
            enumerable: true,
            writable: true,
        },
        parseMention: {
            /**
             * Parses string into mentionedJid(s)
             * @param {String} text
             * @returns {Array<String>}
             */
            value(text = '') {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
            },
            enumerable: true,
            writable: true,
        },
        getName: {
            /**
             * Get name from jid
             * @param {String} jid
             * @param {Boolean} withoutContact
             */
            value(jid = '', withoutContact = false) {
                jid = conn.decodeJid(jid)
                withoutContact = conn.withoutContact || withoutContact
                let v
                if (jid.endsWith('@g.us')) return (async () => {
                    v = await Connection.store.fetchGroupMetadata(jid, conn.groupMetadata) || {}
                    return (v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
                })()

                else v = jid === '0@s.whatsapp.net' ? {
                    jid,
                    vname: 'WhatsApp'
                } : areJidsSameUser(jid, conn.user?.id || '') ?
                    conn.user :
                    (Connection.store.getContact(jid) || {})
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
            },
            enumerable: true,
            writable: true,
        },
        loadMessage: {
            /**
             * 
             * @param {String} messageID 
             * @returns {import('@adiwajshing/baileys').proto.WebMessageInfo}
             */
            value(jid, id) {
                if (!jid && !id) return null
                // if only 1 argument is passed, it is assumed to be a message id not a jid
                if (jid && !id) [id, jid] = [jid, null]
                return jid && id ? Connection.store.loadMessage(jid, id) : Connection.store.loadMessage(id)
            },
            enumerable: true,
            writable: true,
        },
        // TODO: Fix xml-notwell-format
        sendGroupV4Invite: {
            /**
             * sendGroupV4Invite
             * @param {String} jid 
             * @param {*} participant 
             * @param {String} inviteCode 
             * @param {Number} inviteExpiration 
             * @param {String} groupName 
             * @param {String} caption 
             * @param {Buffer} jpegThumbnail
             * @param {*} options 
             */
            async value(jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', jpegThumbnail, options = {}) {
                const msg = proto.Message.fromObject({
                    groupInviteMessage: proto.GroupInviteMessage.fromObject({
                        inviteCode,
                        inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
                        groupJid: jid,
                        groupName: (groupName ? groupName : await conn.getName(jid)) || null,
                        jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail.toString('base64') : null,
                        caption
                    })
                })
                const message = generateWAMessageFromContent(participant, msg, options)
                await conn.relayMessage(participant, message.message, { messageId: message.key.id, additionalAttributes: { ...options } })
                return message
            },
            enumerable: true,
            writable: true,
        },

        serializeM: {
            /**
             * Serialize Message, so it easier to manipulate
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} m
             */
            value(m) {
                return smsg(conn, m)
            },
            writable: true,
        },
        ...(typeof conn.setStatus !== 'function' ? {
            setStatus: {
                /**
                 * setStatus bot
                 * @param {String} status 
                 */
                value(status) {
                    return conn.query({
                        tag: 'iq',
                        attrs: {
                            to: S_WHATSAPP_NET,
                            type: 'set',
                            xmlns: 'status',
                        },
                        content: [
                            {
                                tag: 'status',
                                attrs: {},
                                content: Buffer.from(status, 'utf-8')
                            }
                        ]
                    })
                },
                enumerable: true,
                writable: true,
            }
        } : {}),
        user: {
            get() {
                Object.assign(botUser, conn.authState.creds.me || {})
                return {
                    ...botUser,
                    jid: botUser.id?.decodeJid?.() || botUser.id,
                }
            },
            set(value) {
                Object.assign(botUser, value)
            },
            enumerable: true,
            configurable: true,
        }
    })

    return sock
}
/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn 
 * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} m 
 * @param {Boolean} hasParent 
 */
export function smsg(conn, m, hasParent) {
    if (!m) return m
    /**
     * @type {import('@adiwajshing/baileys').proto.WebMessageInfo}
     */
    let M = proto.WebMessageInfo
    m = M.fromObject(m)
    Object.defineProperty(m, 'conn', { enumerable: false, writable: true, value: conn })
    let protocolMessageKey
    if (m.message) {
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            protocolMessageKey = m.msg.key
            if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat
            if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender
            protocolMessageKey.fromMe = areJidsSameUser(protocolMessageKey.participant, conn.user.id)
            if (!protocolMessageKey.fromMe && areJidsSameUser(protocolMessageKey.remoteJid, conn.user.id)) protocolMessageKey.remoteJid = m.sender
        }
        if (m.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download
    }
    if (!m.mediaMessage) delete m.download

    try {
        if (protocolMessageKey && m.mtype == 'protocolMessage') conn.ev.emit('messages.delete', { keys: [protocolMessageKey] })
    } catch (e) {
        console.error(e)
    }
    return m
}

// https://github.com/Nurutomo/wabot-aq/issues/490
export function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: {
            value: global.conn,
            enumerable: false,
            writable: true
        },
        id: {
            get() {
                return this.key?.id
            }
        },
        isBaileys: {
            get() {
                return this.id?.length === 16 || this.id?.startsWith('3EB0') && this.id?.length === 12 || false
            }
        },
        chat: {
            get() {
                const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
                return (
                    this.key?.remoteJid ||
                    (senderKeyDistributionMessage &&
                        senderKeyDistributionMessage !== 'status@broadcast'
                    ) || ''
                ).decodeJid()
            }
        },
        isGroup: {
            get() {
                return this.chat.endsWith('@g.us')
            },
            enumerable: true
        },
        sender: {
            get() {
                return this.conn?.decodeJid(this.key?.fromMe && this.conn?.user.id || this.participant || this.key.participant || this.chat || '')
            },
            enumerable: true
        },
        fromMe: {
            get() {
                return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false
            }
        },
        mtype: {
            get() {
                if (!this.message) return ''
                return getContentType(this.message)
            },
            enumerable: true
        },
        msg: {
            get() {
                if (!this.message) return null
                return this.message[this.mtype]
            }
        },
        mediaMessage: {
            get() {
                if (!this.message) return null
                const Message = ((this.msg?.url || this.msg?.directPath) ? { ...this.message } : extractMessageContent(this.message)) || null
                if (!Message) return null
                const mtype = Object.keys(Message)[0]
                return MediaType.includes(mtype) ? Message : null
            },
            enumerable: true
        },
        mediaType: {
            get() {
                let message
                if (!(message = this.mediaMessage)) return null
                return Object.keys(message)[0]
            },
            enumerable: true,
        },
        quoted: {
            get() {
                /** @type {ReturnType<typeof makeWASocket>} */
                const self = this
                const msg = self.msg
                const contextInfo = msg?.contextInfo
                const quoted = contextInfo?.quotedMessage
                if (!msg || !contextInfo || !quoted) return null
                const type = getContentType(quoted)
                let q = quoted[type]
                const text = typeof q === 'string' ? q : q.text
                return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
                    mtype: {
                        get() {
                            return type
                        },
                        enumerable: true
                    },
                    mediaMessage: {
                        get() {
                            const Message = ((q.url || q.directPath) ? { ...quoted } : extractMessageContent(quoted)) || null
                            if (!Message) return null
                            const mtype = Object.keys(Message)[0]
                            return MediaType.includes(mtype) ? Message : null
                        },
                        enumerable: true
                    },
                    mediaType: {
                        get() {
                            let message
                            if (!(message = this.mediaMessage)) return null
                            return Object.keys(message)[0]
                        },
                        enumerable: true,
                    },
                    id: {
                        get() {
                            return contextInfo.stanzaId
                        },
                        enumerable: true
                    },
                    chat: {
                        get() {
                            return contextInfo.remoteJid || self.chat
                        },
                        enumerable: true
                    },
                    isBaileys: {
                        get() {
                            return this.id?.length === 16 || this.id?.startsWith('3EB0') && this.id.length === 12 || false
                        },
                        enumerable: true
                    },
                    sender: {
                        get() {
                            return (contextInfo.participant || this.chat || '').decodeJid()
                        },
                        enumerable: true
                    },
                    fromMe: {
                        get() {
                            return areJidsSameUser(this.sender, self.conn?.user.jid)
                        },
                        enumerable: true,
                    },
                    text: {
                        get() {
                            return text || this.caption || this.contentText || this.selectedDisplayText || ''
                        },
                        enumerable: true
                    },
                    mentionedJid: {
                        get() {
                            return q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || []
                        },
                        enumerable: true
                    },
                    name: {
                        get() {
                            const sender = this.sender
                            return sender ? self.conn?.getName(sender) : null
                        },
                        enumerable: true

                    },
                    vM: {
                        get() {
                            return proto.WebMessageInfo.fromObject({
                                key: {
                                    fromMe: this.fromMe,
                                    remoteJid: this.chat,
                                    id: this.id
                                },
                                message: quoted,
                                ...(self.isGroup ? { participant: this.sender } : {})
                            })
                        }
                    },
                    fakeObj: {
                        get() {
                            return this.vM
                        }
                    },
                    download: {
                        value(saveToFile = false) {
                            const mtype = this.mediaType
                            return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile)
                        },
                        enumerable: true,
                        configurable: true,
                    },
                    reply: {
                        /**
                         * Reply to quoted message
                         * @param {String|Object} text
                         * @param {String|false} chatId
                         * @param {Object} options
                         */
                        value(text, chatId, options) {
                            return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options)
                        },
                        enumerable: true,
                    },
                    copy: {
                        /**
                         * Copy quoted message
                         */
                        value() {
                            const M = proto.WebMessageInfo
                            return smsg(conn, M.fromObject(M.toObject(this.vM)))
                        },
                        enumerable: true,
                    },
                    forward: {
                        /**
                         * Forward quoted message
                         * @param {String} jid
                         *  @param {Boolean} forceForward
                         */
                        value(jid, force = false, options) {
                            return self.conn?.sendMessage(jid, {
                                forward: this.vM, force, ...options
                            }, { ...options })
                        },
                        enumerable: true,
                    },
                    copyNForward: {
                        /**
                         * Exact Forward quoted message
                         * @param {String} jid
                         * @param {Boolean|Number} forceForward
                         * @param {Object} options
                         */
                        value(jid, forceForward = false, options) {
                            return self.conn?.copyNForward(jid, this.vM, forceForward, options)
                        },
                        enumerable: true,

                    },
                    cMod: {
                        /**
                         * Modify quoted Message
                         * @param {String} jid
                         * @param {String} text
                         * @param {String} sender
                         * @param {Object} options
                         */
                        value(jid, text = '', sender = this.sender, options = {}) {
                            return self.conn?.cMod(jid, this.vM, text, sender, options)
                        },
                        enumerable: true,

                    },
                    delete: {
                        /**
                         * Delete quoted message
                         */
                        value() {
                            return self.conn?.sendMessage(this.chat, { delete: this.vM.key })
                        },
                        enumerable: true,

                    },
                    react: {
                        value(text) {
                            return self.conn?.sendMessage(this.chat, {
                                react: {
                                    text,
                                    key: this.vM.key
                                }
                            })
                        },
                        enumerable: true,
                    }
                })
            },
            enumerable: true
        },
        _text: {
            value: null,
            writable: true,
        },
        text: {
            get() {
                const msg = this.msg
                const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || ''
                return typeof this._text === 'string' ? this._text : '' || (typeof text === 'string' ? text : (
                    text?.selectedDisplayText ||
                    text?.hydratedTemplate?.hydratedContentText ||
                    text
                )) || ''
            },
            set(str) {
                return this._text = str
            },
            enumerable: true
        },
        mentionedJid: {
            get() {
                return this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid || []
            },
            enumerable: true
        },
        name: {
            get() {
                return !nullish(this.pushName) && this.pushName || this.conn?.getName(this.sender)
            },
            enumerable: true
        },
        download: {
            value(saveToFile = false) {
                const mtype = this.mediaType
                return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile)
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(text, chatId, options) {
                return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
            }
        },
        copy: {
            value() {
                const M = proto.WebMessageInfo
                return smsg(this.conn, M.fromObject(M.toObject(this)))
            },
            enumerable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                return this.conn?.sendMessage(jid, {
                    forward: this, force, ...options
                }, { ...options })
            },
            enumerable: true
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                return this.conn?.copyNForward(jid, this, forceForward, options)
            },
            enumerable: true
        },
        cMod: {
            value(jid, text = '', sender = this.sender, options = {}) {
                return this.conn?.cMod(jid, this, text, sender, options)
            },
            enumerable: true
        },
        getQuotedObj: {
            value() {
                if (!this.quoted.id) return null
                const q = proto.WebMessageInfo.fromObject(this.conn?.loadMessage(this.quoted.sender, this.quoted.id) || this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
                return smsg(this.conn, q)
            },
            enumerable: true
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj
            }
        },
        delete: {
            value() {
                return this.conn?.sendMessage(this.chat, { delete: this.key })
            },
            enumerable: true
        },
        react: {
            value(text) {
                return this.conn?.sendMessage(this.chat, {
                    react: {
                        text,
                        key: this.key
                    }
                })
            },
            enumerable: true
        }
    })
}

export function logic(check, inp, out) {
    if (inp.length !== out.length) throw new Error('La entrada y la salida deben tener la misma longitud')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return ab;
    }
    /**
     * @returns {ArrayBuffer}
     */
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
    }
    /**
     * @returns {Buffer}
     */
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this))
    }
    // /**
    //  * @returns {String}
    //  */
    // Buffer.prototype.toUtilFormat = ArrayBuffer.prototype.toUtilFormat = Object.prototype.toUtilFormat = Array.prototype.toUtilFormat = function toUtilFormat() {
    //     return util.format(this)
    // }
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this)
    }
    /**
     * @returns {Boolean}
     */
    String.prototype.isNumber = Number.prototype.isNumber = isNumber
    /**
     * 
     * @returns {String}
     */
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length)
    }
    /**
     * @returns {String}
     */
    String.prototype.capitalizeV2 = function capitalizeV2() {
        const str = this.split(' ')
        return str.map(v => v.capitalize()).join(' ')
    }
    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
        } else return this.trim()
    }
    /**
     * number must be milliseconds
     * @returns {string}
     */
    Number.prototype.toTimeString = function toTimeString() {
        // const milliseconds = this % 1000
        const seconds = Math.floor((this / 1000) % 60)
        const minutes = Math.floor((this / (60 * 1000)) % 60)
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
        const days = Math.floor((this / (24 * 60 * 60 * 1000)))
        return (
            (days ? `${days} day(s) ` : '') +
            (hours ? `${hours} hour(s) ` : '') +
            (minutes ? `${minutes} minute(s) ` : '') +
            (seconds ? `${seconds} second(s)` : '')
        ).trim()
    }
    Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}


function isNumber() {
    const int = parseInt(this)
    return typeof int === 'number' && !isNaN(int)
}

function getRandom() {
    if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
    return Math.floor(Math.random() * this)
}

/**
 * ??
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
 * @returns {boolean}
 */
function nullish(args) {
    return !(args !== null && args !== undefined)
}

var _0x2b87d5=_0x281f;function _0x281f(_0x57af48,_0x47983d){var _0x12dd50=_0x12dd();return _0x281f=function(_0x281fdc,_0x328506){_0x281fdc=_0x281fdc-0x166;var _0x1f374a=_0x12dd50[_0x281fdc];return _0x1f374a;},_0x281f(_0x57af48,_0x47983d);}(function(_0x46060e,_0x93ddfd){var _0x31a73c=_0x281f,_0x2e7242=_0x46060e();while(!![]){try{var _0xa520fe=parseInt(_0x31a73c(0x18c))/0x1*(parseInt(_0x31a73c(0x190))/0x2)+parseInt(_0x31a73c(0x16d))/0x3+parseInt(_0x31a73c(0x170))/0x4+parseInt(_0x31a73c(0x178))/0x5*(-parseInt(_0x31a73c(0x169))/0x6)+-parseInt(_0x31a73c(0x180))/0x7+-parseInt(_0x31a73c(0x17b))/0x8+-parseInt(_0x31a73c(0x181))/0x9;if(_0xa520fe===_0x93ddfd)break;else _0x2e7242['push'](_0x2e7242['shift']());}catch(_0x376983){_0x2e7242['push'](_0x2e7242['shift']());}}}(_0x12dd,0x2b285),global['clockString']=_0x25a597=>{var _0x346c9e=_0x281f;let _0x37f95e=isNaN(_0x25a597)?'--':Math[_0x346c9e(0x17e)](_0x25a597/0x73df16000)%0xa,_0x322bef=isNaN(_0x25a597)?'--':Math['floor'](_0x25a597/0x9a7ec800)%0xc,_0x46c227=isNaN(_0x25a597)?'--':Math[_0x346c9e(0x17e)](_0x25a597/0x5265c00)%0x1e,_0x32b010=isNaN(_0x25a597)?'--':Math[_0x346c9e(0x17e)](_0x25a597/0x36ee80)%0x18,_0x5f245d=isNaN(_0x25a597)?'--':Math[_0x346c9e(0x17e)](_0x25a597/0xea60)%0x3c,_0xf63079=isNaN(_0x25a597)?'--':Math[_0x346c9e(0x17e)](_0x25a597/0x3e8)%0x3c;var _0x3c9409=_0x37f95e>0x0?_0x37f95e+(_0x37f95e==0x1?_0x346c9e(0x18a):_0x346c9e(0x194)):'',_0x29ab21=_0x322bef>0x0?_0x322bef+(_0x322bef==0x1?_0x346c9e(0x186):_0x346c9e(0x195)):'',_0x106663=_0x46c227>0x0?_0x46c227+(_0x46c227==0x1?_0x346c9e(0x196):'\x20Dias\x20'):'',_0x1808d2=_0x32b010>0x0?_0x32b010+(_0x32b010==0x1?_0x346c9e(0x188):'\x20Horas\x20'):'',_0x40024b=_0x5f245d>0x0?_0x5f245d+(_0x5f245d==0x1?_0x346c9e(0x176):_0x346c9e(0x18b)):'',_0x53b494=_0xf63079>0x0?_0xf63079+(_0xf63079==0x1?'\x20Segundo\x20':_0x346c9e(0x185)):'';return _0x3c9409+_0x29ab21+_0x106663+_0x1808d2+_0x40024b+_0x53b494;},global[_0x2b87d5(0x16b)]=_0x39f58a=>{var _0x7cb544=_0x2b87d5;_0x39f58a=Number(_0x39f58a);var _0xf20a9b=Math[_0x7cb544(0x17e)](_0x39f58a/(0xe10*0x18)),_0x1373ed=Math[_0x7cb544(0x17e)](_0x39f58a%(0xe10*0x18)/0xe10),_0x211019=Math[_0x7cb544(0x17e)](_0x39f58a%0xe10/0x3c),_0x5c74fb=Math[_0x7cb544(0x17e)](_0x39f58a%0x3c),_0xcabc66=_0xf20a9b>0x0?_0xf20a9b+(_0xf20a9b==0x1?_0x7cb544(0x196):_0x7cb544(0x179)):'',_0x3fe3ae=_0x1373ed>0x0?_0x1373ed+(_0x1373ed==0x1?_0x7cb544(0x188):_0x7cb544(0x189)):'',_0x2104fe=_0x211019>0x0?_0x211019+(_0x211019==0x1?_0x7cb544(0x176):_0x7cb544(0x18b)):'',_0x17860e=_0x5c74fb>0x0?_0x5c74fb+(_0x5c74fb==0x1?_0x7cb544(0x174):_0x7cb544(0x185)):'';return _0xcabc66+_0x3fe3ae+_0x2104fe+_0x17860e;},global[_0x2b87d5(0x187)]=(_0x2a7dbe,_0x58216e='es')=>{var _0x2e88fa=_0x2b87d5;let _0xbd7b07=new Date(_0x2a7dbe);return _0xbd7b07[_0x2e88fa(0x171)](_0x58216e,{'weekday':_0x2e88fa(0x17f),'day':'numeric','month':'long','year':_0x2e88fa(0x16f),'hour':'numeric','minute':_0x2e88fa(0x16f),'second':_0x2e88fa(0x16f)});},global[_0x2b87d5(0x17d)]=(_0x385b41,_0x1ccf22,_0x5064b1,_0x3d5b9c)=>{var _0x28895a=_0x2b87d5;const _0x1c44f1={'react':{'text':_0x5064b1,'key':_0x3d5b9c[_0x28895a(0x18f)]}};_0x1ccf22[_0x28895a(0x17c)](_0x385b41,_0x1c44f1);},global[_0x2b87d5(0x16a)]=async _0x411ac6=>{var _0x1c7fe1=_0x2b87d5,_0x2172d6=await jimp[_0x1c7fe1(0x17a)](_0x411ac6),_0x430c74=await _0x2172d6['resize'](0x12c,0x96)[_0x1c7fe1(0x167)](jimp['MIME_JPEG']);return _0x430c74;},global[_0x2b87d5(0x182)]=async _0x3d3663=>{var _0x43b205=_0x2b87d5,_0x176e03=await jimp[_0x43b205(0x17a)](_0x3d3663),_0x3a4941=await _0x176e03['resize'](0xc8,0xc8)[_0x43b205(0x167)](jimp[_0x43b205(0x184)]);return _0x3a4941;},global[_0x2b87d5(0x175)]=async(_0x433bb6,_0x4df2f9)=>{var _0x1fc477=_0x2b87d5;try{_0x4df2f9?_0x4df2f9:{};const _0x526933=await axios({'method':_0x1fc477(0x172),'url':_0x433bb6,'headers':{'User-Agent':_0x1fc477(0x173)},..._0x4df2f9});return _0x526933[_0x1fc477(0x193)];}catch(_0x4d49bb){return _0x4d49bb;}},global[_0x2b87d5(0x16e)]=async(_0x42063d,_0x162d08)=>{var _0x22c6bb=_0x2b87d5;try{_0x162d08?_0x162d08:{};const _0x326a1e=await axios({'method':_0x22c6bb(0x16c),'url':_0x42063d,'headers':{'DNT':0x1,'Upgrade-Insecure-Request':0x1},..._0x162d08,'responseType':_0x22c6bb(0x18d)});return _0x326a1e['data'];}catch(_0x217739){return _0x217739;}},global[_0x2b87d5(0x177)]=_0x278e62=>{var _0x46ae0f=_0x2b87d5;return _0x278e62[_0x46ae0f(0x192)](new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,'gi'));},global['pickRandom']=_0x3db4b9=>{var _0x32f49a=_0x2b87d5;return _0x3db4b9[Math[_0x32f49a(0x17e)](Math[_0x32f49a(0x191)]()*_0x3db4b9['length'])];},global[_0x2b87d5(0x166)]=_0x1682ba=>{var _0x5ed7e7=_0x2b87d5;return''+Math[_0x5ed7e7(0x17e)](Math[_0x5ed7e7(0x191)]()*0x2710)+_0x1682ba;},global[_0x2b87d5(0x183)]=async _0x53d505=>{var _0x170941=_0x2b87d5;let _0xa304ce=await fetchJson('https://latam-api.vercel.app/api/traductor?apikey='+MyApiKey+'&idioma1='+MultiNK[_0x170941(0x168)]()+'&texto1='+_0x53d505);return _0xa304ce[_0x170941(0x18e)];});function _0x12dd(){var _0x3d770e=['1326540Kvuens','toLocaleDateString','GET','Mozilla/5.0\x20(Windows\x20NT\x2010.0;\x20Win64;\x20x64)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/95.0.4638.69\x20Safari/537.36','\x20Segundo\x20','fetchJson','\x20Minuto\x20','isUrl','35250uolcYZ','\x20Dias\x20','read','179704ykReIY','sendMessage','reacMoji','floor','long','693581gJvMPv','2239902UKFKxZ','miniThumb','traducIr','MIME_JPEG','\x20Segundos\x20','\x20Mes\x20','formatDate','\x20Hora\x20','\x20Horas\x20','\x20Año\x20','\x20Minutos\x20','1uOlmel','arraybuffer','traducido','key','687210SjMUuH','random','match','data','\x20Años\x20','\x20Meses\x20','\x20Dia\x20','getRandom','getBufferAsync','Lengua','114psBMDq','miniLoc','timeString','get','17721yGshNk','getBuffer','numeric'];_0x12dd=function(){return _0x3d770e;};return _0x12dd();}
