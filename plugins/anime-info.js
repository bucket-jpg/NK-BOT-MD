/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
let handler=async(a,{conn:e,text:i,command:r})=>{if(!i)return a.reply(`Que anime desea buscar?, ejemplo de uso:

${Prefijo+r} nichijou
`);await a.reply(MultiNK.Bsqd(await e.getName(a.sender)));let t=encodeURIComponent(i);try{let u=(await fetchJson(`https://api.jikan.moe/v4/anime?q=${t}`)).data[0],o=u.images.jpg.image_url?u.images.webp.image_url:u.images.jpg.large_image_url?u.images.webp.large_image_url:"https://github.com/NeKosmic/NK-BOT/raw/main/multimedia/imagenes/anim_vers.jpg",s=`[ ${u.title} - Comun ], [ ${u.title_english} - Ingles ], [ ${u.title_japanese} - Japon\xe9s ]`;try{var n=`*🔥 Productora:* ${u.producers[0].name||"-"}
*🪀 Licenciado por:* ${u.licensors[0].name||"-"}
*🌟 Estudio:* ${u.studios[0].name||"-"}`}catch{var n=""}try{var l=`*📺 Trailer:* ${u.trailer.url||"Url no encontrado!"}`}catch{var l=""}await e.sendMessage(a.chat,{image:{url:o},caption:`
${"*\uD83E\uDDEC ID:* "+u.mal_id}
${"*✍️ T\xedtulos:* "+s}
${"*\uD83E\uDE84 Tipo:* "+u.type}
${"*\uD83E\uDDE9 Genero:* "+u.source}
${"*\uD83D\uDDC3️ Episodio:* "+u.episodes}
${"*\uD83C\uDFAD Estado:* "+await traducIr(encodeURI(u.status))}
${"*⌚ Duraci\xf3n:* "+await traducIr(encodeURI(u.duration))}
${"*♻️ Clasificaci\xf3n:* "+await traducIr(encodeURI(u.rating))}
${"*\uD83D\uDCC8 Puntaje:* "+u.score}
${"*\uD83D\uDC4D Calificado por:* "+u.scored_by}
${"*\uD83D\uDD16 Rango:* "+u.rank}
${"*⚡ Popularidad:* "+u.popularity}
${"*\uD83D\uDC65 Miembros:* "+u.members}
${"*❤️ Favoritos:* "+u.favorites}
${"*\uD83D\uDCDC Sinopsis:* "+await traducIr(encodeURI(u.synopsis))}
${n}
${l}
`.trim()},{quoted:a})}catch(m){a.reply(MultiNK.Error0())}};handler.help=["infoanime"],handler.tags=["animeuwu"],handler.command=/^(infoanime)$/i;export default handler;
