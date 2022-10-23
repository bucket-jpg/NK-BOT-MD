/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
let handler = async (m, { conn, args }) => {
	if (!args[0]) return
	if(!isUrl(args[0]) && !args[0].includes('youtube.com')) return
	let name = await conn.getName(m.sender)
	let sections=[{title:"⏺️ - ⏮️ ⏸️ ⏭️ - \uD83D\uDD00",rows:[{title:"*[ > ] Descarga*",description:"1.- audio",rowId:`${Prefijo}ytmp3 ${args[0]}`},{title:"*[ > ] Descarga*",description:"2.- audio",rowId:`${Prefijo}yta ${args[0]}`},{title:"*[ > ] Descarga*",description:"3.- audio",rowId:`${Prefijo}ytabochi ${args[0]}`}]},{title:"\uD83C\uDFA6 - ⏮️ ⏸️ ⏭️ - \uD83D\uDD00",rows:[{title:"*[ > ] Descarga*",description:"1.- video",rowId:`${Prefijo}ytmp4 ${args[0]}`},{title:"*[ > ] Descarga*",description:"2.- video",rowId:`${Prefijo}ytv ${args[0]}`},{title:"*[ > ] Descarga*",description:"3.- video",rowId:`${Prefijo}ytvbochi ${args[0]}`}]}];
try {
await conn.sendMessage(m.chat, { text: `┗━━━━━━━━━━━━━━━━━━━`, footer: '\n'+NombreDelBot, title: `┏━━━━━━━━━━━━━━━━━━━\n${args[0]}`, buttonText: " Seleccione una opción ", sections }, { quoted: m })
} catch (e) {
m.reply(MultiNK.Error0())
}
}

//handler.help = ['listytdl <link>']
handler.tags = ['servicio']
handler.command = /^(listytdl)$/i

export default handler
