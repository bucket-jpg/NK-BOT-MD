import * as fs from 'fs'

let handler = async (m, { conn }) => {
	let uwur = await conn.profilePictureUrl(m.chat, 'image').catch(_ => './multimedia/imagenes/myunivers.jpg')
await conn.sendMessage(m.chat, { image: {url: uwur}, jpegThumbnail: fs.readFileSync('./multimedia/imagenes/mylogo.jpg'), caption: `
╔═══════════
╟{ MENU +18 }
║
║㋡ ${Prefijo}hentai
╚═══════════
`.trim() }, { quoted: m })
}

handler.help = ['labiblia']
handler.command = /^(labiblia)$/i
handler.group = true
handler.premium = true

export default handler
