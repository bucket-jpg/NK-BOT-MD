import db from '../lib/database.js'

let handler = m => m
handler.before = async function (m) {
    if (!/^-?[0-9]+(\.[0-9]+)?$/.test(m.text)) return !0
    let id = m.chat
    if (!m.quoted || !m.quoted.fromMe || !m.text || !/^¿Cuál es el resultado de/i.test(m.quoted.text)) return !0
    this.math = this.math ? this.math : {}
    if (!(id in this.math)) return this.sendMessage(m.chat, {text: 'La pregunta ya fue resuelta...'}, {quoted: m})
    if (m.quoted.id == this.math[id][0].id) {
        let math = JSON.parse(JSON.stringify(this.math[id][1]))
        if (m.text == math.result) {
            db.data.users[m.sender].exp += math.bonus
            clearTimeout(this.math[id][3])
            delete this.math[id]
            this.sendButton(m.chat, `*Respuesta correcta!*\nAqui tienes tu recompensa:\n+${math.bonus} XP\n`, NombreDelBot, null, [['SIGUIENTE', Prefijo+`mates ${math.mode}`]], m)
        } else {
            if (--this.math[id][2] == 0) {
                clearTimeout(this.math[id][3])
                delete this.math[id]
                m.reply(`*[ ! ] Se acabo el tiempo*\nRespuesta: *${math.result}*`)
            } else m.reply(`*Respuesta incorrecta!*\nTe quedan ${this.math[id][2]} oportunidades`)
        }
    }
    return !0
}

export default handler
