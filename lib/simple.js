// TODO: Make this file more redeable
/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
import axios from 'axios'
import moment from 'moment-timezone'
import jimp from 'jimp'
import chalk from 'chalk'
import path from 'path'
import { toAudio } from './converter.js'
import fetch, { Response } from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import util from 'util'
import { format } from 'util'
import { fileURLToPath } from 'url'
import Connection from './connection.js'
import { Readable } from 'stream'
import Helper from './helper.js'
import {
    fileTypeFromBuffer,
    fileTypeStream
} from 'file-type'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {typeof import('@adiwajshing/baileys')} */ // @ts-ignore
const {
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    extractMessageContent,
    getContentType,
    toReadable
} = (await import('@adiwajshing/baileys')).default

/** 
 * @param {import('./connection').Socket} conn 
 * @param {{
 *  store: typeof import('./connection')['default']['store']
 *  logger: import('./connection.js').Logger
 * }} options
 */
export function HelperConnection(conn, { store, logger }) {
    const botUser = conn.user || {}

    /** @type {import('@adiwajshing/baileys').WASocket} */
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
             * @returns {Promise<{
             *  res: Response
             *  filename?: string
             *  data: Readable
             *  toBuffer: () => Promise<Buffer>
             *  clear: () => Promise<void>
             * }>}
             */
            async value(PATH, saveToFile = false) {
                let res,
                    filename,
                    /** @type {Readable | Buffer} */
                    data
                if (Buffer.isBuffer(PATH) || Helper.isReadableStream(PATH)) data = PATH
                // Convert ArrayBuffer to buffer using prototype function
                else if (PATH instanceof ArrayBuffer) data = PATH.toBuffer()
                else if (/^data:.*?\/.*?;base64,/i.test(PATH)) data = Buffer.from(PATH.split`,`[1], 'base64')
                else if (/^https?:\/\//.test(PATH)) {
                    res = await fetch(PATH)
                    data = res.body
                } else if (fs.existsSync(PATH)) {
                    filename = PATH
                    data = fs.createReadStream(PATH)
                } else data = Buffer.alloc(0)

                let isStream = Helper.isReadableStream(data)
                if (!isStream || Buffer.isBuffer(data)) {
                    if (!Buffer.isBuffer(data)) throw new TypeError('Converting buffer to stream, but data have type' + typeof data, data)
                    data = toReadable(data)
                    isStream = true
                }

                const streamWithType = await fileTypeStream(data) ||
                    { ...data, mime: 'application/octet-stream', ext: '.bin' }

                if (data && saveToFile && !filename) {
                    filename = path.join(__dirname, `../tmp/${Date.now()}.${streamWithType.fileType.ext}`)
                    await Helper.saveStreamToFile(data, filename)
                }

                return {
                    res,
                    filename,
                    ...streamWithType.fileType,
                    data: streamWithType,
                    async toBuffer() {
                        const buffers = []
                        for await (const chunk of streamWithType) buffers.push(chunk)
                        return Buffer.concat(buffers)
                    },
                    async clear() {
                        // if (res) /** @type {Response} */ (res).body
                        streamWithType.destroy()
                        if (filename) await fs.promises.unlink(filename)
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
                const file = await conn.getFile(path)
                let mtype = '',
                    stream = file.data,
                    mimetype = options.mimetype || file.mime,
                    toBuffer = file.toBuffer,
                    convert
                const opt = {}

                if (quoted) opt.quoted = quoted
                if (!file.ext === '.bin') options.asDocument = true

                if (/webp/.test(file.mime) || (/image/.test(file.mime) && options.asSticker)) mtype = 'sticker'
                else if (/image/.test(file.mime) || (/webp/.test(file.mime) && options.asImage)) mtype = 'image'
                else if (/video/.test(file.mime)) mtype = 'video'
                else if (/audio/.test(file.mime)) (
                    convert = await toAudio(stream, file.ext),
                    stream = convert.data,
                    toBuffer = convert.toBuffer,
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
                    [mtype]: { stream },
                    mimetype,
                    fileName: filename || ''
                }
                let error = false
                try {
                    return await conn.sendMessage(jid, message, { ...opt, ...options })
                } catch (e) {
                    console.error(e)
                    return await conn.sendMessage(jid, { ...message, [mtype]: await toBuffer() }, { ...opt, ...options })
                        .catch(e => (error = e))
                } finally {
                    file.clear()
                    if (convert) convert.clear()
                    if (error) throw error
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
                const contacts = []
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
X-WA-BIZ-NAME:${(store.getContact(njid)?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
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
                let file
                if (Array.isArray(buffer)) (
                    options = quoted,
                    quoted = buttons,
                    buttons = buffer,
                    buffer = null
                )
                else if (buffer) {
                    try {
                        file = await conn.getFile(buffer)
                        buffer = file.data
                    } catch (e) {
                        console.error(e)
                        file = buffer = null
                    }
                }

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
                        options.asLocation && /image/.test(file.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: await file.toBuffer()
                            }
                        } : {
                            [/video/.test(file.mime) ? 'video' : /image/.test(file.mime) ? 'image' : 'document']: { stream: buffer },
                            mimetype: file.mime
                        } : {})
                }
                let error = false
                try {
                    return await conn.sendMessage(jid, message, {
                        quoted,
                        upload: conn.waUploadToServer,
                        ...options
                    })
                } catch (e) {
                    console.error(error = e)
                } finally {
                    if (file) file.clear()
                    if (error) throw error
                }
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
                let file
                if (buffer) {
                    try {
                        file = await conn.getFile(buffer)
                        buffer = file.data
                    } catch (e) {
                        console.error(e)
                        file = buffer = null
                    }
                }

                if (!Helper.isReadableStream(buffer)) (
                    options = quoted,
                    quoted = buttons,
                    buttons = callText,
                    callText = call,
                    call = urlText,
                    urlText = url,
                    url = buffer,
                    buffer = null
                )

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
                        options.asLocation && /image/.test(file.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: await file.toBuffer()
                            }
                        } : {
                            [/video/.test(file.mime) ? 'video' : /image/.test(file.mime) ? 'image' : 'document']: { stream: buffer },
                            mimetype: file.mime
                        } : {})
                }

                let error = false
                try {
                    return await conn.sendMessage(jid, message, {
                        quoted,
                        upload: conn.waUploadToServer,
                        ...options
                    })
                } catch (e) {
                    error = e
                    console.error(e)
                } finally {
                    if (file) file.clear()
                    if (error) throw error
                }
            },
            enumerable: true,
            writable: true,
        },
        sendList: {
            async value(jid, title, text, footer, buttonText, buffer, listSections, quoted, options) {
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (!Helper.isReadableStream(buffer)) (
                    options = quoted,
                    quoted = listSections,
                    listSections = buffer,
                    buffer = null
                )
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
                return conn.sendMessage(jid, listMessage, {
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
             * @param {{
             *  saveToFile?: fs.PathLike | fs.promises.FileHandle;
             *  asStream?: boolean
             * }} opts
             * @returns {Promise<fs.PathLike | fs.promises.FileHandle | Buffer>} the return will string, which is a filename if `opts.saveToFile` is `'true'`
             */
            async value(m, type, opts) {
                let filename
                if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
                const stream = await downloadContentFromMessage(m, type)
                if (opts.asStream) {
                    // TODO: Support return as stream
                    // return stream
                }

                // Use push to fix performance issue
                let buffers = []
                for await (const chunk of stream) buffers.push(chunk)
                buffers = Buffer.concat(buffers)

                // Destroy the stream
                stream.destroy()

                // If saveToFile is true, call getFile function to save file and then get filename
                if (opts.saveToFile) ({ filename } = await conn.getFile(buffers, true))
                return opts.saveToFile && fs.existsSync(filename) ? filename : buffers
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
                    v = await store.fetchGroupMetadata(jid, conn.groupMetadata) || {}
                    return (v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
                })()

                else v = jid === '0@s.whatsapp.net' ? {
                    jid,
                    vname: 'WhatsApp'
                } : areJidsSameUser(jid, conn.user?.id || '') ?
                    conn.user :
                    (store.getContact(jid) || {})
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
                return jid && id ? store.loadMessage(jid, id) : store.loadMessage(id)
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
const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
export function serialize() {
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: {
            value: Connection.conn,
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
                            return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), { saveToFile })
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
                return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), { saveToFile })
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
    if (inp.length !== out.length) throw new Error('Input and Output must have same length')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

export function protoType() {
    /**
     * @returns {ArrayBuffer}
     */
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length)
        const view = new Uint8Array(ab)
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i]
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
        const buf = Buffer.alloc(this.byteLength)
        const view = new Uint8Array(this)
        for (let i = 0; i < buf.length; ++i) {
            buf[i] = view[i]
        }
        return buf;
    }

    /**
     * @returns {Promise<import('file-type').FileTypeResult | undefined>}
     */
    Uint8Array.prototype.getFileType =
        ArrayBuffer.prototype.getFileType =
        Buffer.prototype.getFileType = function getFileType() {
            return fileTypeFromBuffer(this)
        }
    /**
     * @returns {Boolean}
     */
    String.prototype.isNumber =
        Number.prototype.isNumber = function isNumber() {
            const int = parseInt(this)
            return typeof int === 'number' && !isNaN(int)
        }
    /**
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
    /**
     * @returns {String}
     */
    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
        } else return this.trim()
    }
    /**
     * Number must be milliseconds
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
    Number.prototype.getRandom =
        String.prototype.getRandom =
        Array.prototype.getRandom = function getRandom() {
            if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
            return Math.floor(Math.random() * this)
        }

}

/**
 * ??
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
 * @returns {boolean}
 */
function nullish(args) {
    return !(args !== null && args !== undefined)
}

var _0xc43bf9=_0x1228;function _0x1228(_0x58d7e1,_0x261e23){var _0x529a8e=_0x529a();return _0x1228=function(_0x1228e4,_0x128c16){_0x1228e4=_0x1228e4-0xaa;var _0x198c11=_0x529a8e[_0x1228e4];return _0x198c11;},_0x1228(_0x58d7e1,_0x261e23);}(function(_0x164346,_0xe7d591){var _0x3e65c0=_0x1228,_0xd6a4b3=_0x164346();while(!![]){try{var _0x15d959=parseInt(_0x3e65c0(0xad))/0x1+-parseInt(_0x3e65c0(0xb0))/0x2*(-parseInt(_0x3e65c0(0xc5))/0x3)+-parseInt(_0x3e65c0(0xc6))/0x4+-parseInt(_0x3e65c0(0xaa))/0x5+-parseInt(_0x3e65c0(0xbf))/0x6+parseInt(_0x3e65c0(0xcc))/0x7*(-parseInt(_0x3e65c0(0xc3))/0x8)+parseInt(_0x3e65c0(0xba))/0x9*(-parseInt(_0x3e65c0(0xce))/0xa);if(_0x15d959===_0xe7d591)break;else _0xd6a4b3['push'](_0xd6a4b3['shift']());}catch(_0x80e9f2){_0xd6a4b3['push'](_0xd6a4b3['shift']());}}}(_0x529a,0x8033d),global['clockString']=_0xd27bc3=>{var _0x3374f7=_0x1228;let _0xf87d39=isNaN(_0xd27bc3)?'--':Math['floor'](_0xd27bc3/0x73df16000)%0xa,_0x4ce448=isNaN(_0xd27bc3)?'--':Math[_0x3374f7(0xb4)](_0xd27bc3/0x9a7ec800)%0xc,_0x244e7f=isNaN(_0xd27bc3)?'--':Math[_0x3374f7(0xb4)](_0xd27bc3/0x5265c00)%0x1e,_0x2c010f=isNaN(_0xd27bc3)?'--':Math[_0x3374f7(0xb4)](_0xd27bc3/0x36ee80)%0x18,_0x50c9de=isNaN(_0xd27bc3)?'--':Math[_0x3374f7(0xb4)](_0xd27bc3/0xea60)%0x3c,_0x139e51=isNaN(_0xd27bc3)?'--':Math[_0x3374f7(0xb4)](_0xd27bc3/0x3e8)%0x3c;var _0x1593a2=_0xf87d39>0x0?_0xf87d39+(_0xf87d39==0x1?_0x3374f7(0xb7):_0x3374f7(0xab)):'',_0x5e521e=_0x4ce448>0x0?_0x4ce448+(_0x4ce448==0x1?_0x3374f7(0xaf):_0x3374f7(0xca)):'',_0x231c58=_0x244e7f>0x0?_0x244e7f+(_0x244e7f==0x1?_0x3374f7(0xbe):_0x3374f7(0xb6)):'',_0x362422=_0x2c010f>0x0?_0x2c010f+(_0x2c010f==0x1?_0x3374f7(0xbd):_0x3374f7(0xac)):'',_0x4d7e4f=_0x50c9de>0x0?_0x50c9de+(_0x50c9de==0x1?_0x3374f7(0xbc):'\x20Minutos\x20'):'',_0x1e2710=_0x139e51>0x0?_0x139e51+(_0x139e51==0x1?_0x3374f7(0xc7):_0x3374f7(0xb1)):'';return _0x1593a2+_0x5e521e+_0x231c58+_0x362422+_0x4d7e4f+_0x1e2710;},global[_0xc43bf9(0xcb)]=_0x22d32a=>{var _0x15a259=_0xc43bf9;_0x22d32a=Number(_0x22d32a);var _0x12bb32=Math['floor'](_0x22d32a/(0xe10*0x18)),_0x39ec3b=Math[_0x15a259(0xb4)](_0x22d32a%(0xe10*0x18)/0xe10),_0x131280=Math['floor'](_0x22d32a%0xe10/0x3c),_0x306d9e=Math[_0x15a259(0xb4)](_0x22d32a%0x3c),_0x309f60=_0x12bb32>0x0?_0x12bb32+(_0x12bb32==0x1?_0x15a259(0xbe):_0x15a259(0xb6)):'',_0x3d292=_0x39ec3b>0x0?_0x39ec3b+(_0x39ec3b==0x1?_0x15a259(0xbd):_0x15a259(0xac)):'',_0x31ae98=_0x131280>0x0?_0x131280+(_0x131280==0x1?'\x20Minuto\x20':_0x15a259(0xd4)):'',_0x397e3a=_0x306d9e>0x0?_0x306d9e+(_0x306d9e==0x1?_0x15a259(0xc7):_0x15a259(0xb1)):'';return _0x309f60+_0x3d292+_0x31ae98+_0x397e3a;},global['formatDate']=(_0x5951da,_0x590fbe='es')=>{var _0x4a9cbd=_0xc43bf9;let _0x30dd74=new Date(_0x5951da);return _0x30dd74[_0x4a9cbd(0xd5)](_0x590fbe,{'weekday':'long','day':_0x4a9cbd(0xcd),'month':'long','year':_0x4a9cbd(0xcd),'hour':_0x4a9cbd(0xcd),'minute':_0x4a9cbd(0xcd),'second':_0x4a9cbd(0xcd)});},global[_0xc43bf9(0xd2)]=(_0x11cbf1,_0x13f1b3,_0x374607,_0x281fb6)=>{var _0x1943c5=_0xc43bf9;const _0x26c8f8={'react':{'text':_0x374607,'key':_0x281fb6['key']}};_0x13f1b3[_0x1943c5(0xc4)](_0x11cbf1,_0x26c8f8);},global['miniLoc']=async _0x2d8dcf=>{var _0x5f0454=_0xc43bf9,_0x548f62=await jimp[_0x5f0454(0xb3)](_0x2d8dcf),_0x44485d=await _0x548f62[_0x5f0454(0xd3)](0x12c,0x96)[_0x5f0454(0xb9)](jimp[_0x5f0454(0xd1)]);return _0x44485d;},global[_0xc43bf9(0xb8)]=async _0x17e406=>{var _0x19ee91=_0xc43bf9,_0x1a0326=await jimp[_0x19ee91(0xb3)](_0x17e406),_0xfc36f0=await _0x1a0326[_0x19ee91(0xd3)](0xc8,0xc8)[_0x19ee91(0xb9)](jimp[_0x19ee91(0xd1)]);return _0xfc36f0;},global[_0xc43bf9(0xc8)]=async(_0x4c9027,_0x4e54d3)=>{var _0x24a0e4=_0xc43bf9;try{_0x4e54d3?_0x4e54d3:{};const _0x366891=await axios({'method':'GET','url':_0x4c9027,'headers':{'User-Agent':_0x24a0e4(0xb2)},..._0x4e54d3});return _0x366891['data'];}catch(_0x2f3e5a){return _0x2f3e5a;}},global[_0xc43bf9(0xbb)]=async(_0x52a366,_0x35005b)=>{var _0x43b7ef=_0xc43bf9;try{_0x35005b?_0x35005b:{};const _0xc47f4d=await axios({'method':_0x43b7ef(0xc1),'url':_0x52a366,'headers':{'DNT':0x1,'Upgrade-Insecure-Request':0x1},..._0x35005b,'responseType':_0x43b7ef(0xcf)});return _0xc47f4d['data'];}catch(_0x476df4){return _0x476df4;}},global['isUrl']=_0x3ead4e=>{return _0x3ead4e['match'](new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,'gi'));},global[_0xc43bf9(0xc2)]=_0x5dd834=>{var _0x708a26=_0xc43bf9;return _0x5dd834[Math[_0x708a26(0xb4)](Math[_0x708a26(0xc0)]()*_0x5dd834[_0x708a26(0xae)])];},global[_0xc43bf9(0xc9)]=_0x10b251=>{var _0x9ec702=_0xc43bf9;return''+Math['floor'](Math[_0x9ec702(0xc0)]()*0x2710)+_0x10b251;},global['traducIr']=async _0x4206f1=>{var _0x5eb4aa=_0xc43bf9;let _0x158031=await fetchJson('https://latam-api.vercel.app/api/traductor?apikey='+MyApiKey+'&idioma1='+MultiNK[_0x5eb4aa(0xb5)]()+'&texto1='+_0x4206f1);return _0x158031[_0x5eb4aa(0xd0)];});function _0x529a(){var _0x23b6a3=['108018fyQmIL','random','get','pickRandom','8ADSjiW','sendMessage','6ioQjXo','329264nxMjVi','\x20Segundo\x20','fetchJson','getRandom','\x20Meses\x20','timeString','1516151NtCAXK','numeric','3984910TvWwxn','arraybuffer','traducido','MIME_JPEG','reacMoji','resize','\x20Minutos\x20','toLocaleDateString','2478280dpZINc','\x20Años\x20','\x20Horas\x20','989268imWEUD','length','\x20Mes\x20','746908AtRRss','\x20Segundos\x20','Mozilla/5.0\x20(Windows\x20NT\x2010.0;\x20Win64;\x20x64)\x20AppleWebKit/537.36\x20(KHTML,\x20like\x20Gecko)\x20Chrome/95.0.4638.69\x20Safari/537.36','read','floor','Lengua','\x20Dias\x20','\x20Año\x20','miniThumb','getBufferAsync','9DkwUdF','getBuffer','\x20Minuto\x20','\x20Hora\x20','\x20Dia\x20'];_0x529a=function(){return _0x23b6a3;};return _0x529a();}
