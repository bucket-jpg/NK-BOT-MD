import * as fs from 'fs'

let handler = async (m, { conn }) => {
	let uwur = await conn.profilePictureUrl(m.chat, 'image').catch(_ => './multimedia/imagenes/myunivers.jpg')
await conn.sendMessage(m.chat, { image: {url: uwur}, jpegThumbnail: fs.readFileSync('./multimedia/imagenes/mylogo.jpg'), caption: `
╔═══════════
╟{ ANIME }
║
║圆 ${Prefijo}anifrase
║圆 ${Prefijo}waifu_hd
║圆 ${Prefijo}rostro_4k
║圆 ${Prefijo}infoanime
║圆 ${Prefijo}neko
║圆 ${Prefijo}snime
║圆 ${Prefijo}waifu
╚═══════════
`.trim() }, { quoted: m })
}

handler.help = ['mianime']
handler.command = /^(mianime)$/i
handler.group = true

export default handler
