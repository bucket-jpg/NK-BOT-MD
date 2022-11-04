import * as fs from 'fs'

let handler = async (m, { conn }) => {
	let uwur = await conn.profilePictureUrl(m.chat, 'image').catch(_ => './multimedia/imagenes/myunivers.jpg')
await conn.sendMessage(m.chat, { image: {url: uwur}, jpegThumbnail: fs.readFileSync('./multimedia/imagenes/mylogo.jpg'), caption: `
╔═══════════
╟{ CONVERSORES }
║
║❖ ${Prefijo}aimg
║❖ ${Prefijo}amp3
║❖ ${Prefijo}aptt
║❖ ${Prefijo}taxta | texte | tixti | toxto | tuxtu
║❖ ${Prefijo}robot
║❖ ${Prefijo}aumentarbajo
║❖ ${Prefijo}memedist
║❖ ${Prefijo}inframundo
║❖ ${Prefijo}nightcore
║❖ ${Prefijo}ardilla
║❖ ${Prefijo}superveloz
║❖ ${Prefijo}demonio
║❖ ${Prefijo}lento
║❖ ${Prefijo}cursed
║❖ ${Prefijo}reversa
║❖ ${Prefijo}ventilador
║❖ ${Prefijo}acelerarvid
║❖ ${Prefijo}lentovid
║❖ ${Prefijo}reversavid
║❖ ${Prefijo}getexif
║❖ ${Prefijo}spago
║❖ ${Prefijo}sticker
║❖ ${Prefijo}wm
║❖ ${Prefijo}rescom
║❖ ${Prefijo}robar
╠═══════════
╟{ HERRAMIENTAS }
║
║❖ ${Prefijo}delcmd
║❖ ${Prefijo}listcmd
║❖ ${Prefijo}unlockcmd
║❖ ${Prefijo}lockcmd
║❖ ${Prefijo}setcmd
╠═══════════
╟{ CASUAL }
║
║❖ ${Prefijo}afk
║❖ ${Prefijo}apoyo
║❖ ${Prefijo}estadobot
║❖ ${Prefijo}informacion
║❖ ${Prefijo}admins
║❖ ${Prefijo}gpinfo
║❖ ${Prefijo}gplist
║❖ ${Prefijo}horario
║❖ ${Prefijo}desreg
║❖ ${Prefijo}listprem
║❖ ${Prefijo}miperfil
║❖ ${Prefijo}rg
║❖ ${Prefijo}wame
║❖ ${Prefijo}unete
║❖ ${Prefijo}encuesta
║❖ ${Prefijo}creador
╠═══════════
╟{ RPG-JUEGOS }
║
║❖ ${Prefijo}delttt
║❖ ${Prefijo}ttt
║❖ ${Prefijo}calumnia
║❖ ${Prefijo}mates
║❖ ${Prefijo}emparejar
║❖ ${Prefijo}quien
║❖ ${Prefijo}testgey
║❖ ${Prefijo}top10
║❖ ${Prefijo}top5
║❖ ${Prefijo}tragamoneda
║❖ ${Prefijo}abrir
║❖ ${Prefijo}aventura
║❖ ${Prefijo}comprar
║❖ ${Prefijo}vender
║❖ ${Prefijo}diario
║❖ ${Prefijo}inventario
║❖ ${Prefijo}mensual
║❖ ${Prefijo}sanar
║❖ ${Prefijo}transferir
╠═══════════
╟{ XP Y LIMITE }
║
║❖ ${Prefijo}ranking
║❖ ${Prefijo}minivel
║❖ ${Prefijo}subirnivel
╠═══════════
╟{ ADMINISTRACIÓN }
║
║❖ ${Prefijo}suprimir
║❖ ${Prefijo}cgpen
║❖ ${Prefijo}agp
║❖ ${Prefijo}gpdesc
║❖ ${Prefijo}gpname
║❖ ${Prefijo}hidetag
║❖ ${Prefijo}invocar
║❖ ${Prefijo}reiniciarvotos
║❖ ${Prefijo}votacion
║❖ ${Prefijo}darpoder
║❖ ${Prefijo}quitarpoder
║❖ ${Prefijo}gplink
║❖ ${Prefijo}encender
║❖ ${Prefijo}apagar
║❖ ${Prefijo}deathnote
╠═══════════
╟{ PROPIETARIO }
║
║❖ ${Prefijo}actualizarbot
║❖ ${Prefijo}banchat
║❖ ${Prefijo}bcgc
║❖ ${Prefijo}unbanchat
║❖ ${Prefijo}add
║❖ ${Prefijo}encender
║❖ ${Prefijo}apagar
║❖ ${Prefijo}saveplugin
║❖ ${Prefijo}cleartmp
║❖ ${Prefijo}lenguaje
║❖ ${Prefijo}neoqr
║❖ ${Prefijo}banear
║❖ ${Prefijo}desbanear
║❖ ${Prefijo}ban
║❖ ${Prefijo}delprem
║❖ ${Prefijo}addprem
╟{ SIMPLE-TRABAS }
║❖ ${Prefijo}c1
║❖ ${Prefijo}c2
║❖ ${Prefijo}c3
║❖ ${Prefijo}c4
║❖ ${Prefijo}c5
║❖ ${Prefijo}c6
║❖ ${Prefijo}c7
║❖ ${Prefijo}c8
╟{ AVANZADO }
║❖  >
║❖  =>
║❖  $
╚═══════════
`.trim() }, { quoted: m })
}

handler.help = ['menusimple']
handler.command = /^(menusimple)$/i
handler.group = true

export default handler
