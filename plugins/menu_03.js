import * as fs from 'fs'

let handler = async (m, { conn }) => {
	let uwur = await conn.profilePictureUrl(m.chat, 'image').catch(_ => './multimedia/imagenes/myunivers.jpg')
await conn.sendMessage(m.chat, { image: {url: uwur}, jpegThumbnail: fs.readFileSync('./multimedia/imagenes/mylogo.jpg'), caption: `
╔═══════════
╟{ CREA-LOGOS }
║
║☞ ${Prefijo}logo
║☞ ${Prefijo}lolice
║☞ ${Prefijo}horny
║☞ ${Prefijo}blur
║☞ ${Prefijo}gay
║☞ ${Prefijo}triggered
║☞ ${Prefijo}simpcard
║☞ ${Prefijo}pixelate
║☞ ${Prefijo}its-so-stupid
║☞ ${Prefijo}youtube-comment
║☞ ${Prefijo}escribir
║☞ ${Prefijo}imgtxt
╚═══════════
`.trim() }, { quoted: m })
}

handler.help = ['logofabrica']
handler.command = /^(logofabrica)$/i
handler.group = true

export default handler
