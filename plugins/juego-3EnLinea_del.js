let handler = async (e, {
	conn: a,
	usedPrefix: l,
	command: t
}) => {
	let d = Object.values(a.game).find(a => a.id.startsWith("tictactoe") && [a.game.playerX, a.game.playerO].includes(e.sender));
	void 0 != d && (delete a.game[d.id], await e.reply("*Sala 3 en linea eliminado correctamente ✓*"))
};
handler.help = ["delttt"], handler.tags = ["games"], handler.command = /^(delttt)$/, handler.group = !0;
export default handler;
