module.exports ={ 
    name: "ping",
    description: "reply Pong!",
    run: async (interaction, client) => {
        return await interaction.reply(`🏓Latency is ${Math.round(client.ws.ping)}ms`);
    }
}