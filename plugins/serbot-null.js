import { protoType, serialize } from "../lib/simple.js"
import { toBuffer, toDataURL } from "qrcode"
import util from "util"
import fs from "fs"
import * as ws from 'ws'
import Connection from "../lib/connection.js"

const {
  default: makeWASocket,
  DisconnectReason,
  useSingleFileAuthState,
  generateWAMessageFromContent
} = (await import("@adiwajshing/baileys")).default

let handler = async(m, { conn: _conn }) => {
	let msg=await generateWAMessageFromContent(m.chat,{locationMessage:{degreesLatitude:0,degreesLongitude:0,name:'[_>] Como instalar el bot...',address:`Este comando aun no funciona en el bot MultiDevice! || Libreria: Baileys-MD`,url:'https://api.whatsapp.com/send?phone=51995386439&text=Wenas%2C%20necesito%20su%20ayuda%20para%20instalar%20el%20bot%20NK-Bot-Multidevice%20%3A)',isLive:!0,accuracyInMeters:0,speedInMps:0,degreesClockwiseFromMagneticNorth:2,comment:'',jpegThumbnail:fs.readFileSync('./multimedia/imagenes/logo.jpg')}},{quoted:m}) 
	await _conn.relayMessage(m.chat, msg.message, {})
	reacMoji(m.chat, _conn, '❌', m)

/**
  if(!fs.existsSync("esclabots/")) fs.mkdirSync("esclabots")
  global.conns = global.conns || {}
  if(global.conns[m.sender]) return m.reply('No se puedes ser un bot dentro de otro bot!\n\nhttps://wa.me/' + (await Connection.conn).user.jid.split`@`[0] + '?text='+Prefijo+'serbot')

  const { state, saveState } = useSingleFileAuthState(`esclabots/us-${m.sender.split("@")[0]}.json`)

  function start() {
    const conn = makeWASocket({
      printQRInTerminal: false,
      auth: state
    })
    const logout = async() => {
      await _conn.sendMessage(conn.user?.jid || m.chat, { text: 'Conexión perdida...' })
      try { conn.ws.close() } catch {}
      delete global.conns[m.sender]
    }
    let lastQr, shouldSendLogin, errorCount = 0

    conn.handler = _conn.handler.bind(_conn)
    conn.onDelete = _conn.onDelete.bind(_conn)
    conn.participantsUpdate = _conn.participantsUpdate.bind(_conn)
    conn.groupsUpdate = _conn.groupsUpdate.bind(_conn)
    conn.ev.on("messages.upsert", _conn.handler)
    conn.ev.on("messages-delete", _conn.onDelete)
    conn.ev.on("group-participants.update", _conn.participantsUpdate)
    conn.ev.on("groups.update", _conn.groupsUpdate)
    conn.ev.on("creds.update", saveState)
    conn.ev.on("connection.update", async({ qr, isNewLogin, lastDisconnect })=> {
      conn.ev.emit("multi.sessions", _conn)
      if(shouldSendLogin && conn.user) await _conn.sendMessage(conn.user.jid, { text: 'Conectado exitosamente con WhatsApp.\n*NOTA: Esto es solo un paseo*\n' + JSON.stringify(conn.user, null, 2) }, { quoted: m })
        }

      if(qr) {
        if(lastQr) await lastQr.delete()
        let buff = await toBuffer(qr)
        lastQr = await _conn.sendMessage(m.chat, {
          image: buff,
          caption: `
Escanea este QR para convertirte en un bot temporal
1. Haga clic en los tres puntos en la esquina superior derecha
2. Toque el dispositivo vinculado
3. Escanea este QR 
El código QR caducará!
`.trim()
        }, {
          quoted: m
        })
      }

      if(isNewLogin) shouldSendLogin = true

      if(lastDisconnect) {
        const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
        if(code && code !== DisconnectReason.loggedOut && conn?.ws.readyState !== ws.CONNECTING) {
          console.log(await Connection.reload(conn, true, { isChild: true }).catch(console.error))
          delete global.conns[m.sender]
        } else if(code == DisconnectReason.loggedOut) logout()
        errorCount++
      }

      if(errorCount > 5) await logout()
    })

    global.conns[m.sender] = {
      connected: true,
      runtime: 0
    }
  }
  return start()
**/
}

handler.help = ['serbot']
handler.tags = ['esclabot']
handler.command = /^(serbot|rentbot|esclabot|jadibot)$/i

export default handler
