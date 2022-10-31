/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'
import moment from 'moment-timezone'

let handler=async(e,{conn:n,args:a,text:o,command:t,groupMetadata:i})=>{let r=await n.getName(e.sender),d=moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("DD/MM/YY HH:mm:ss"),s=r.length>4?`🧰 ${r}
`:"",l=i.subject.length>9?`
⚙️ ${i.subject}
`:"",m=o.length>0?`

"${o}"`:`

⌚ ${d}`,u=!1;try{let c=e.quoted?e.quoted:e,g=(c.msg||c).mimetype||c.mediaType||"";if(/webp|image|video/g.test(g)){if(/video/g.test(g)&&(c.msg||c).seconds>11)return e.reply(`*[ ! ] M\xe1xima duraci\xf3n de v\xeddeo son 10 segundos!*`);let p=await c.download?.();if(!p)return e.reply(`*[ ! ] Por favor Envie o Responda un video o una imagen usando el comando ${Prefijo+t}*
_NOTA : duracion de video 1 a 10 segundos m\xe1ximo_ ✓`);e.reply(MultiNK.Proces(r));let v;try{u=await sticker(p,!1,"",`
${s}${l}
🤖 ${NombreDelBot}${m}`),reacMoji(e.chat,n,"⚙️",e)}catch(y){console.error(y)}finally{u||(/webp/g.test(g)?v=await webp2png(p):/video/g.test(g)&&(v=await uploadFile(p)),v&&"string"==typeof v||(v=await uploadImage(p)),u=await sticker(!1,v,"",`
${s}${l}
🤖 ${NombreDelBot}${m}`))}}else if(a[0]){if(!isUrl(a[0]))return e.reply("[ ! ] Url inv\xe1lido, prueba con otro ;3");u=await sticker(!1,a[0],"",`
${s}${l}
🤖 ${NombreDelBot}

⌚ ${d}










`)}}catch(f){console.error(f),u||(u=f)}finally{if(!u)return e.reply(`*[ ! ] Por favor Envie o Responda un video o una imagen usando el comando ${Prefijo+t}*
_NOTA : duracion de video 1 a 10 segundos m\xe1ximo_ ✓`);n.sendFile(e.chat,u,"sticker.webp","",e)}};

handler.help = ['sticker [multimedia/url]']
handler.tags = ['conversor']
handler.command = /^s(tic?ker)?(gif)?$/i

export default handler

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'))
}
