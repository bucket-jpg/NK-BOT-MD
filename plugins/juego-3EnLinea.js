import TicTacToe from '../lib/tictactoe.js'

let handler = async (m, { conn, command, text }) => {
    conn.game = conn.game ? conn.game : {}
    if (Object.values(conn.game).find(room => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender))) return m.reply('Ya estas en una sala activa creada por ti mismo -.-')
    let room = Object.values(conn.game).find(room => room.state === 'ESPERE' && (text ? room.name === text : true))
    // m.reply('[WIP Feature]')
    if (room) {
        m.reply('Rival encontrado!\nᴱˡ ᶦⁿᶦᶜᶦᵃᵈᵒʳ ᵗᶦᵉⁿᵉ ᑫᵘᵉ ᶜᵒᵐᵉⁿᶻᵃʳ ᵉˡ ʲᵘᵉᵍᵒ ᵉˢᶜʳᶦᵇᶦᵉⁿᵈᵒ ᵘⁿ ⁿᵘ́ᵐᵉʳᵒ ᵈᵉ ⁰ ᵃˡ ⁹ ᵖᵃʳᵃ ᶜᵒᵐᵉⁿᶻᵃʳ')
        room.o = m.chat
        room.game.playerO = m.sender
        room.state = 'JUGANDO'
        let arr = room.game.render().map(v => {
            return {
                X: '❌',
                O: '⭕',
                1: '1️⃣',
                2: '2️⃣',
                3: '3️⃣',
                4: '4️⃣',
                5: '5️⃣',
                6: '6️⃣',
                7: '7️⃣',
                8: '8️⃣',
                9: '9️⃣',
            }[v]
        })
        let str = `
ID de sala: ${room.id}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

@${room.game.currentTurn.split('@')[0]} tiene que comenzar el juego

~Escriba :~ 

rendirse 

~para darse por vencido~
`.trim()
        if (room.x !== room.o) await conn.reply(room.x, str, m, { mentions: conn.parseMention(str)})
        await conn.reply(room.o, str, m, { mentions: conn.parseMention(str)})
    } else {
        room = {
            id: 'tictactoe-' + (+new Date),
            x: m.chat,
            o: '',
            game: new TicTacToe(m.sender, 'o'),
            state: 'ESPERE'
        }
        if (text) room.name = text
        m.reply('*[ ! ]Esperando rival*\n' + (text ? ` Para unirse al juego use el comando:
\n\n${Prefijo + command} ${text}\n` : ` Para unirse al juego use el comando:\n\n ${Prefijo + command}\n\n_Recompensa para el ganador +4000 de XP_\n`))
        conn.game[room.id] = room
    }
}

handler.help = ['ttt']
handler.tags = ['games']
handler.command = /^(ttt)$/
handler.group = true

export default handler
