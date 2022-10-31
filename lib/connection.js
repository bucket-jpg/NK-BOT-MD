/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
// @ts-check
import * as ws from 'ws'
import path from 'path'
import storeSystem from './store.js'
import Helper from './helper.js'
import { HelperConnection } from './simple.js'
import importFile from './import.js'
import db, { loadDatabase } from './database.js'
import single2multi from './single2multi.js'
import fs from 'fs'
import chalk from 'chalk'
import pino from 'pino'

/** @type {import('@adiwajshing/baileys')} */
// @ts-ignore
const MyInfo = JSON.parse(fs.readFileSync('./package.json'));
const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason
} = (await import('@adiwajshing/baileys')).default

const authFolder = storeSystem.fixFileName(`${Helper.opts._[0] || ''}sesiones`)
const authFile = `${Helper.opts._[0] || 'sesion'}.dt.json`

let [
    isCredsExist,
    isAuthSingleFileExist,
    authState
] = await Promise.all([
    Helper.checkFileExists(authFolder + '/creds.json'),
    Helper.checkFileExists(authFile),
    storeSystem.useMultiFileAuthState(authFolder)
])

//let authState = await storeSystem.useMultiFileAuthState(authFolder)
let { version, isLatest } = await fetchLatestBaileysVersion()
const store = storeSystem.makeInMemoryStore()

// Convert single auth to multi auth
if (Helper.opts['singleauth'] || Helper.opts['singleauthstate']) {
    if (!isCredsExist && isAuthSingleFileExist) {
        console.debug('- singleauth -', 'creds.json no encontrado', 'compilando singleauth a multiauth...')
        await single2multi(authFile, authFolder, authState)
        console.debug('- singleauth -', 'compilado con éxito')
        authState = await storeSystem.useMultiFileAuthState(authFolder)
    } else if (!isAuthSingleFileExist) console.error('- singleauth -', 'archivo singleauth no encontrado')
}

/**const storeFile = `${Helper.opts._[0] || 'data'}.store.json`
store.readFromFile(storeFile)**/

// from: https://github.com/adiwajshing/Baileys/blob/master/src/Utils/logger.ts
const logger = pino({ level: 'silent' })

/** @type {import('@adiwajshing/baileys').UserFacingSocketConfig} */
const connectionOptions = {
    printQRInTerminal: true,
    browser: ['<[ NeKosmic ]>', 'Safari','1.0.0'],
    auth: authState.state,
    logger,
    version
}

/** 
 * @typedef {{ 
 *  handler?: typeof import('../handler').handler; 
 *  participantsUpdate?: typeof import('../handler').participantsUpdate; 
 *  groupsUpdate?: typeof import('../handler').groupsUpdate; 
 *  onDelete?:typeof import('../handler').deleteUpdate; 
 *  connectionUpdate?: typeof connectionUpdate; 
 *  credsUpdate?: () => void 
 * }} EventHandlers
 * @typedef {Required<import('@adiwajshing/baileys').UserFacingSocketConfig>['logger']} Logger
 * @typedef {ReturnType<typeof makeWASocket> & EventHandlers & { 
 *  isInit?: boolean; 
 *  isReloadInit?: boolean; 
 *  msgqueque?: import('./queque').default;
 *  logger?: Logger
 * }} Socket 
 */


/** @type {Map<string, Socket>} */
let conns = new Map();
/** 
 * @param {Socket?} oldSocket 
 * @param {{ 
 *  handler?: typeof import('../handler'); 
 *  isChild?: boolean; 
 *  connectionOptions?: Partial<import('@adiwajshing/baileys').UserFacingSocketConfig>; 
 *  store: typeof store 
 * }} opts
 */
async function start(oldSocket = null, opts = { store }) {
    /** @type {Socket} */
    let conn = makeWASocket(connectionOptions)
    HelperConnection(conn, { store: opts.store, logger })

    if (oldSocket) {
        conn.isInit = oldSocket.isInit
        conn.isReloadInit = oldSocket.isReloadInit
    }
    if (conn.isInit == null) {
        conn.isInit = false
        conn.isReloadInit = true
    }

    store.bind(conn.ev, {
        groupMetadata: conn.groupMetadata
    })
    await reload(conn, false, opts).then((success) => console.log(chalk.bgWhite('Evento controlador de enlace : ', success+'\n')))

    return conn
}


let OldHandler = null
/** 
 * @param {Socket} conn 
 * @param {boolean} restartConnection
 * @param {{ 
 *  handler?: Promise<typeof import('../handler')> | typeof import('../handler'); 
 *  isChild?: boolean 
 * }} opts
 */
async function reload(conn, restartConnection, opts = {}) {
    if (!opts.handler) opts.handler = importFile(Helper.__filename(path.resolve('./handler.js'))).catch(console.error)
    if (opts.handler instanceof Promise) opts.handler = await opts.handler;
    if (!opts.handler && OldHandler) opts.handler = OldHandler
    OldHandler = opts.handler
    // const isInit = !!conn.isInit
    const isReloadInit = !!conn.isReloadInit
    if (restartConnection) {
        try { conn.ws.close() } catch { }
        // @ts-ignore
        conn.ev.removeAllListeners()
        Object.assign(conn, await start(conn) || {})
    }

    // Assign message like welcome, bye, etc.. to the connection
    //Object.assign(conn, getMessageConfig())

    if (!isReloadInit) {
        if (conn.handler) conn.ev.off('messages.upsert', conn.handler)
        if (conn.participantsUpdate) conn.ev.off('group-participants.update', conn.participantsUpdate)
        if (conn.groupsUpdate) conn.ev.off('groups.update', conn.groupsUpdate)
        if (conn.onDelete) conn.ev.off('messages.delete', conn.onDelete)
        if (conn.onCall) conn.ev.off('call', conn.onCall)
        if (conn.connectionUpdate) conn.ev.off('connection.update', conn.connectionUpdate)
        if (conn.credsUpdate) conn.ev.off('creds.update', conn.credsUpdate)
    }
    if (opts.handler) {
        conn.handler = /** @type {typeof import('../handler')} */(opts.handler).handler.bind(conn)
        conn.participantsUpdate = /** @type {typeof import('../handler')} */(opts.handler).participantsUpdate.bind(conn)
        conn.groupsUpdate = /** @type {typeof import('../handler')} */(opts.handler).groupsUpdate.bind(conn)
        conn.onDelete = /** @type {typeof import('../handler')} */(opts.handler).deleteUpdate.bind(conn)
        conn.onCall = /** @type {typeof import('../handler')} */(opts.handler).callUpdate.bind(conn)
    }
    if (!opts.isChild) conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = authState.saveCreds.bind(conn)
    // conn.credsUpdate = authState.saveState.bind(conn)

    /** @typedef {Required<EventHandlers>} Event */
    conn.ev.on('messages.upsert', /** @type {Event} */(conn).handler)
    conn.ev.on('group-participants.update', /** @type {Event} */(conn).participantsUpdate)
    conn.ev.on('groups.update', /** @type {Event} */(conn).groupsUpdate)
    conn.ev.on('messages.delete', /** @type {Event} */(conn).onDelete)
    conn.ev.on('call', /** @type {Event} */(conn).onCall)
    if (!opts.isChild) conn.ev.on('connection.update', /** @type {Event} */(conn).connectionUpdate)
    conn.ev.on('creds.update', /** @type {Event} */(conn).credsUpdate)

    conn.isReloadInit = false
    return true

}

/**
 * @this {Socket}
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['connection.update']} update
 */
async function connectionUpdate(update) {
    console.log(update)
    const { connection, lastDisconnect, isNewLogin } = update
    if (isNewLogin) this.isInit = true
    // @ts-ignore
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
    if (code && code !== DisconnectReason.loggedOut && this?.ws.readyState !== ws.CONNECTING) {
        console.log(await reload(this, true).catch(console.error))
        global.timestamp.connect = new Date
    }
    if (connection == 'open') console.log(chalk.green('\n[_>] CONECTADO :D\n'))
    try {
    MyInfo.waHost = this.user.id.split(':')[0] + "@s.whatsapp.net"
    fs.writeFileSync('./package.json', JSON.stringify(MyInfo, null, '\t'))
    } catch (e) { }
    if (db.data == null) loadDatabase()
    this.groupAcceptInvite('GtxTtrORaAaDdDWBGGX5R5').catch(e => {})
}

const conn = start(null, { store }).catch(console.error)

export default {
    start,
    reload,
    conn,
    conns,
    logger,
    connectionOptions,
    authFolder,
    //storeFile,
    authState,
    store
    //getMessageConfig
}
export {
    conn,
    conns,
    logger
}
