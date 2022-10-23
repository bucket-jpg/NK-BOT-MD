/**
[ By @NeKosmic || https://github.com/NeKosmic/ ]
**/
let handler=async(a,{conn:e,text:i})=>{if(!i)return reply(`Que anime desea buscar?, ejemplo de uso:

${Prefijo+command} nichijou
`);let r=encodeURIComponent(i);try{let t=(await fetchJson(`https://api.jikan.moe/v4/anime?q=${r}`)).data[0],n=t.images.jpg.image_url?t.images.webp.image_url:t.images.jpg.large_image_url?t.images.webp.large_image_url:"https://github.com/NeKosmic/NK-BOT/raw/main/multimedia/imagenes/anim_vers.jpg",o=`[ ${t.title} - Comun ], [ ${t.title_english} - Ingles ], [ ${t.title_japanese} - Japon\xe9s ]`;try{var s=`*🔥 Productora:* ${t.producers[0].name||"-"}
*🪀 Licenciado por:* ${t.licensors[0].name||"-"}
*🌟 Estudio:* ${t.studios[0].name||"-"}`}catch{var s=""}try{var l=`*📺 Trailer:* ${t.trailer.url||"Url no encontrado!"}`}catch{var l=""}await e.sendMessage(a.chat,{image:{url:n},caption:`
${"*\uD83E\uDDEC ID:* "+t.mal_id}
${"*✍️ T\xedtulos:* "+o}
${"*\uD83E\uDE84 Tipo:* "+t.type}
${"*\uD83E\uDDE9 Genero:* "+t.source}
${"*\uD83D\uDDC3️ Episodio:* "+t.episodes}
${"*\uD83C\uDFAD Estado:* "+await traducIr(encodeURI(t.status))}
${"*⌚ Duraci\xf3n:* "+await traducIr(encodeURI(t.duration))}
${"*♻️ Clasificaci\xf3n:* "+await traducIr(encodeURI(t.rating))}
${"*\uD83D\uDCC8 Puntaje:* "+t.score}
${"*\uD83D\uDC4D Calificado por:* "+t.scored_by}
${"*\uD83D\uDD16 Rango:* "+t.rank}
${"*⚡ Popularidad:* "+t.popularity}
${"*\uD83D\uDC65 Miembros:* "+t.members}
${"*❤️ Favoritos:* "+t.favorites}
${"*\uD83D\uDCDC Sinopsis:* "+await traducIr(encodeURI(t.synopsis))}
${s}
${l}
`.trim()},{quoted:a})}catch(m){a.reply(MultiNK.Error0())}};handler.help=["infoanime"],handler.tags=["animeuwu"],handler.command=/^(infoanime)$/i,handler.limit=!0;export default handler;
