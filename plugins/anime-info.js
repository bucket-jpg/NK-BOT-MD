/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
let handler=async(a,{conn:e,text:i})=>{if(!i)return a.reply(`Que anime desea buscar?, ejemplo de uso:

${Prefijo+command} nichijou
`);let r;await a.reply(MultiNK.Bsqd(await e.getName(a.sender)));let t=encodeURIComponent(i);try{let n=(await fetchJson(`https://api.jikan.moe/v4/anime?q=${t}`)).data[0],s=n.images.jpg.image_url?n.images.webp.image_url:n.images.jpg.large_image_url?n.images.webp.large_image_url:"https://github.com/NeKosmic/NK-BOT/raw/main/multimedia/imagenes/anim_vers.jpg",o=`[ ${n.title} - Comun ], [ ${n.title_english} - Ingles ], [ ${n.title_japanese} - Japon\xe9s ]`;try{var l=`*🔥 Productora:* ${n.producers[0].name||"-"}
*🪀 Licenciado por:* ${n.licensors[0].name||"-"}
*🌟 Estudio:* ${n.studios[0].name||"-"}`}catch{var l=""}try{var m=`*📺 Trailer:* ${n.trailer.url||"Url no encontrado!"}`}catch{var m=""}await e.sendMessage(a.chat,{image:{url:s},caption:`
${"*\uD83E\uDDEC ID:* "+n.mal_id}
${"*✍️ T\xedtulos:* "+o}
${"*\uD83E\uDE84 Tipo:* "+n.type}
${"*\uD83E\uDDE9 Genero:* "+n.source}
${"*\uD83D\uDDC3️ Episodio:* "+n.episodes}
${"*\uD83C\uDFAD Estado:* "+await traducIr(encodeURI(n.status))}
${"*⌚ Duraci\xf3n:* "+await traducIr(encodeURI(n.duration))}
${"*♻️ Clasificaci\xf3n:* "+await traducIr(encodeURI(n.rating))}
${"*\uD83D\uDCC8 Puntaje:* "+n.score}
${"*\uD83D\uDC4D Calificado por:* "+n.scored_by}
${"*\uD83D\uDD16 Rango:* "+n.rank}
${"*⚡ Popularidad:* "+n.popularity}
${"*\uD83D\uDC65 Miembros:* "+n.members}
${"*❤️ Favoritos:* "+n.favorites}
${"*\uD83D\uDCDC Sinopsis:* "+await traducIr(encodeURI(n.synopsis))}
${l}
${m}
`.trim()},{quoted:a})}catch(d){a.reply(MultiNK.Error0())}};handler.help=["infoanime"],handler.tags=["animeuwu"],handler.command=/^(infoanime)$/i;export default handler;
