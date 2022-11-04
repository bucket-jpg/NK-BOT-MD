/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
import db from '../lib/database.js'
import { promises } from 'fs'
import { join } from 'path'
import { xpRange } from '../lib/levelling.js'

let handler = async (m, { conn, __dirname, command, isPrems }) => {
let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {}
let totalreg = Object.keys(db.data.users).length
let rtotalreg = Object.values(db.data.users).filter(user => user.registered == true).length
let { exp, level, role } = db.data.users[m.sender]
let { min, xp, max } = xpRange(level, global.multiplier)
let pushname = await conn.getName(m.sender)
let prem = isPrems?'Si':'No'
let limit = isPrems?'∞':db.data.users[m.sender].limit
let sections=[{title:"Menu-Simple \uD83C\uDF0C",rows:[{title:"Funciones-b\xe1sicas",description:"~ᴸᶦˢᵗᵃ ᵈᵉ ᶜᵒᵐᵃⁿᵈᵒˢ ˢᶦᵐᵖˡᵉˢ~",rowId:`${Prefijo}menusimple`}]},{title:"Menu-Internet \uD83C\uDF10",rows:[{title:"Random-Menu",description:"~ᴸᶦˢᵗᵃ ᵈᵉ ᶜᵒᵐᵃⁿᵈᵒˢ ᵛᵃʳᶦᵃᵈᵒˢ~",rowId:`${Prefijo}randmenu`}]},{title:"Menu-Art\xedstico \uD83C\uDFA8",rows:[{title:"Crear-Logos",description:"~ᶜᵒᵐᵃⁿᵈᵒˢ ᵖᵃʳᵃ ᶜʳᵉᵃʳ ˡᵒᵍᵒˢ ʸ ᵐᵃˢ~",rowId:`${Prefijo}logofabrica`},]},{title:"Menu-Otaku/Anime \uD83C\uDC04",rows:[{title:"Random-Anime",description:"~ᶜᵒᵐᵃⁿᵈᵒˢ ᵒᵗᵃᵏᵘ⁻ᵃⁿᶦᵐᵉ ᵛᵃʳᶦᵃᵈᵒ~",rowId:`${Prefijo}mianime`},]},{title:"Menu-Hentai/Anime \uD83E\uDD75",rows:[{title:"La-Biblia",description:"~ᶜᵒᵐᵃⁿᵈᵒˢ ʰᵉⁿᵗᵃᶦ⁻ᶜᵃʳᵗᵒᵒⁿ ⁺\xb9⁸~",rowId:`${Prefijo}labiblia`},]},{title:"Menu-Completo ♻️",rows:[{title:"Principal",description:"~ᴸᶦˢᵗᵃ ᶜᵒᵐᵖˡᵉᵗᵃ ᵈᵉ ᵗᵒᵈᵒˢ ˡᵒˢ ᶜᵒᵐᵃⁿᵈᵒˢ~",rowId:`${Prefijo}menucompleto`}]}];
await conn.sendMessage(m.chat, { text: `║❂ Cliente: ${pushname}
║❂ Premium: ${prem}
║❂ Limite restante: ${limit}
║❂ Nivel: ${level} (${exp} / ${xp})
║❂ Rol: ${role}
║❂ XP: ${exp}
╚══════════`, footer: `┏⊱ ${NombreDelBot}\n┗━⊱ ${MultiNK.Habla()} ✓`, title: `╔I [ \`\`\`${_package.name}\`\`\` ]
║❂ Base de datos: ${rtotalreg} a ${totalreg}
║❂ Tiempo activo: ${timeString(process.uptime())}
║❂ Version del bot: ${_package.version}
║❂ Dueño del bot: ${_package.author.name}
║❂ Prefijo único: 「 ${Prefijo} 」
`, buttonText: "Seleccione un menu ✓ ", sections }, { quoted:m})
reacMoji(m.chat, conn, '📃', m)
}

handler.help = ['menu']
handler.command = /^(menu|comandos|menú|help)$/i

export default handler
