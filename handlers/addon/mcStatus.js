const { MinecraftServerListPing } = require("minecraft-status");
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

const online = "🟢 Online";
const offline = "🔴 Offline";

const update = async (client) => {
	let files = [];
    const color = client.framework.getColors();
    const servers = client.framework.getConfig("minecraft");
	
	for (const settings of servers.list){
		if(settings.ip != ""){
			const info = await MinecraftServerListPing.ping("1.20.4", settings.ip, settings.port, 5000)
			.then(response => {
				return `
	Host: ${(settings.address ? settings.address : `${settings.ip}:${settings.port}`)}
	Server Stats: ${( response.players ? online : offline)}
	Online: ${response.players.online} / ${response.players.max}
	Server Version: ${settings.support}
	`;
			})
			.catch(err=> {
				return `
	Host: ${(settings.address ? settings.address : `${settings.ip}:${settings.port}`)}
	Server Stats: ${offline}
	Online: 0 / 0
	Server Version: ${settings.support}
	`;
			});
			files.push({name: settings.title, value: `\`\`\`\n${info}\`\`\``, inline: false});
		}
	}
	
	return new EmbedBuilder()
		.setTitle(`**Server Status**`)
		.setColor(color.success)
		.setURL(servers.web)
		.addFields(files)
		.setTimestamp()
		.setFooter({text: `Update every ${ms(servers.updateTime)}`, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`});
	
}

const checkOrSend = async (client, log_channel, data) => {
	const channel = await client.channels.cache.get(log_channel)
	let message = await channel.messages.fetch({ limit: 1 }).then(msg => msg.filter(m => m.author.id === client.user.id).last());
		
	if(!message){ 
        await channel.send({ embeds: [data]});
    } else { 
        await message.edit({ embeds: [data]}) 
    }
}

module.exports = {
    run: async (client) => {
		let embed;
		const { log_channel, updateTime } = client.framework.getConfig("minecraft");
		
		embed = await update(client);
		
		await checkOrSend(client, log_channel, embed);
		
		setInterval(async () => {
			
		    embed = await update(client);
			await checkOrSend(client, log_channel, embed);
			
		}, updateTime);
	}
}