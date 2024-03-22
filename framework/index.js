const { Client, Events, GatewayIntentBits, Partials, Collection, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require("@discordjs/rest");

const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const Logger = require('./Logger');
const { min } = require('moment');

const client_settings = {
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.Guilds
    ],
    partials: [Partials.Channel] 
};


class LoggerHook {
    constructor(logger = {}, framework = null){
        this.logger = logger;
        this.sys = framework;
    }
    info(object){
        this.logger.info(object);
        return this;
    }

    warning(object){
        this.logger.warning(object);
        return this;
    }

    error(object){
        this.logger.error(object);
        if(this.sys){
            if(this.sys.notify){
                this.sys.notifyOwner();
            }
        }
        return this;
    }
}

class framework {
    constructor(configuration = {}){
        this.config = configuration;
        this.preload = [];
        this.logger = new LoggerHook(new Logger(false, ""), this);
        this.commands = new Collection();
        this.owners = new Collection();
        this.configFiles = new Collection();
        this.textcommands = null;
        this.client = new Client(client_settings);
        this.errors = this.getDefaultErrors();
        this.colors = this.getDefaultColors();
        this.client.framework = this;
    }

    notify(){
        return this.config.tag_on_error.enabled;
    }

    setConfigFolder(path = ""){
        if(path !== ""){
            this.loadConfigurations(path);
        }
        return this;
    }

    getConfig(name = ""){
        if(name != null && name != ""){
            const configuration = this.configFiles.get(name);
            
            if(configuration === null){
                return {};
            }

            return configuration;
        }
        return this.config;
    }

    isOwnConfig(name){
        switch(name){
            case "config.json":
                return true;
            case "colors.json":
                return true;
            case "errors.json":
                return true;
            default:
                return false;    
        }
    }

    loadConfigurations(path){
        const foldersPath = join(join(__dirname, '../'), path);
        const commandFolders = readdirSync(foldersPath, {withFileTypes: true});
        for (const folder of commandFolders) {
            if(!folder.isDirectory()){
                if(folder.name.endsWith('.json') && !this.isOwnConfig(folder.name)){
                    const filePath = join(foldersPath, folder.name);
                    const config = require(filePath);
                    this.configFiles.set(folder.name.split('.json')[0], config);
                }
            } else {
                this.loadConfigurations(join(path, folder.name));
            }
        }
    }

    setSaveLog(path = null){
        if(path !=null){
            this.logger = new LoggerHook(new Logger(this.config.save_log, path), this);
        }
        return this;
    }

    notifyOwner(){
        for(const guild of this.config.guilds){
            const _guild = this.client.guilds.cache.get(guild);
            for(const _channel of this.config.tag_on_error.log_channel){
                if(_guild.channels.cache.get(_channel) !== undefined)  { 
                    _guild.channels.cache.get(_channel).send({embeds: [
                        new EmbedBuilder()
                        .setTitle(this.errors.notify.title)
                        .setColor(this.colors.error)
                        .setDescription(`<@${this.getOwner(guild)}> ${his.errors.notify.message}`)    
                    ]})
                }
            }
        }
    }

    getDefaultErrors(){
        return {
            not_found: "This command not found!",
            blacklisted: "Your are not allow to use any command!",
            notify:{
                title: ":no_entry: Error!!",
                message: ""
            }
        }
    }

    getDefaultColors(){
        return {
            error: "#ff3333",
            warning: "#ff9933",
            info: "#99ff33",
            success: "#66ff33",
            default: "#33ff33",
        }
    }

    getColors(){
        return this.colors;
    }

    getErrors(){
        return this.errors;
    }

    setErrors(errors = {}){
        this.errors = errors;
        return this;
    }

    setColors(colors = {}){
        this.colors = colors;
        return this;
    }

    setConfig(configuration = null){
        if(configuration){
            this.config = configuration;
        }
        return this;
    }

    async registerCommands(){
        const rest = new REST({ version: "10" }).setToken(this.config.bot.token);

        try {
            this.logger.info("Started refreshing application [/] commands.");
            for(const guild of this.config.guilds){
                await rest.put(Routes.applicationGuildCommands(this.config.bot.application_id, guild), { body: this.commands });
            }
            this.logger.info("Successfully reloaded application [/] commands.");
        } catch(error) {
            this.logger.error(error);
        }

    }

    findOwners(){
        if(this.config.staff.autoDetectOwner){
            for(const guild of this.config.guilds){
                const _guild = this.client.guilds.cache.get(guild);
                this.owners.set(guild, _guild.ownerId);
            }
        } else {
            for(const guild of this.config.guilds){
                this.owners.set(guild, this.config.staff.owner);
            }
        }
    }

    getOwner(guildId = null){

        if(guildId == null){
            return this.owners;
        } else {
            return this.owners.get(guildId);
        }
    }

    isHaveBlacklistRole(user){
        for(const role of this.config.staff.blacklisted){
            if(user.roles.cache.find(r => r.id === role)){
                return true;
            }
        }

        return false;
    }

    registerEvents(){
        const instance = this;

        instance.client.once(Events.ClientReady, async (readyClient) => {
            this.preload.forEach(async (element)=>{
                await element(readyClient);
            })
            await instance.registerCommands();
            instance.findOwners();
            instance.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
        });

        instance.client.on(Events.MessageCreate, async message => {
            if (message.author.bot) return;
            if (!message.guild) return;
            if (!message.content.startsWith(instance.config.textcommand_prefix)) return;

            const args = message.content.slice(instance.config.textcommand_prefix.length).trim().split(/ +/g);
            const cmd = args.shift().toLowerCase();

            if(instance.isHaveBlacklistRole(message.member)){
                instance.logger.warning(`User ${message.author.username} try to run command "${cmd}" but is blacklisted.`);
                return message.channel.send({content: instance.errors.blacklisted, ephemeral: true});
            }

            if(instance.textcommands === null) return;

            if(args.length === 0){

                const single_command = join(instance.textcommands, `${cmd}.js`);

                if (!existsSync(single_command)) {
                    instance.logger.warning(`User ${message.author.username} try to run no matching text command "${cmd}".`);
                    return message.channel.send({content: instance.errors.not_found, ephemeral: true});
                }

                if (single_command === null) return message.channel.send({content: instance.errors.not_found, ephemeral: true});

                return await require(single_command)(instance.client, message, args);

            }
           

            const root = join(instance.textcommands, cmd);
            const command = join(root, `${args[0]}.js`);

            if (!existsSync(command)) {
                instance.logger.warning(`User ${message.author.username} try to run no matching text command "${cmd} ${args[0]}".`);
                return message.channel.send({content: instance.errors.not_found, ephemeral: true});
            }
            
            if (command === null) return message.channel.send({content: instance.errors.not_found, ephemeral: true});

            return await require(command)(instance.client, message, args);

        });

        instance.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = instance.commands.get(interaction.commandName);

            if (!command) {
                instance.logger.warning(`User ${interaction.user.username} try to run no matching text command "${interaction.commandName}".`);
                return;
            }

            if(instance.isHaveBlacklistRole(interaction.member)){
                instance.logger.warning(`User ${interaction.user.username} try to run command "${interaction.commandName}" but is blacklisted.`);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: instance.errors.blacklisted, ephemeral: true });
                } else {
                    await interaction.reply({ content: instance.errors.blacklisted, ephemeral: true });
                }
                return;
            }

            try {
                await command.run(interaction, instance.client);
            } catch (error) {
                instance.logger.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }

        });

        return this;
    }

    addHandler(_function = (client) => {}){
        this.preload.push(_function);
        return this;
    }

    registerHandlers(path = ""){
        const foldersPath = join(join(__dirname, '../'), path);
        const commandFolders = readdirSync(foldersPath, {withFileTypes: true});
        for (const folder of commandFolders) {
            if(!folder.isDirectory()){
                if(folder.name.endsWith('.js')){
                    const filePath = join(foldersPath, folder.name);
                    const command = require(filePath);
                    if ('run' in command) {
						this.logger.info(`Successfully loaded module ${folder.name}.`);
                        this.addHandler(command.run);
                    } else {
                        this.logger.warning(`The handler at ${folder.name} is missing a required "run" property will be not active.`);
                    }
                }
            } else {
                this.registerHandlers(join(path, folder.name));
            }
        }

        return this;
    }


    registerSlashCommandsFolder(path = ""){
        const foldersPath = join(join(__dirname, '../'), path);
        const commandFolders = readdirSync(foldersPath, {withFileTypes: true});
        for (const folder of commandFolders) {
            if(!folder.isDirectory()){
                if(folder.name.endsWith('.js')){
                    const filePath = join(foldersPath, folder.name);
                    const command = require(filePath);
                    if ('name' in command && 'run' in command) {
                        this.commands.set(command.name, command);
                    } else {
                        this.logger.warning(`The command at ${folder.name} is missing a required "name" or "run" property will be bypass.`);
                    }
                }
            } else {
                this.registerSlashCommandsFolder(join(path, folder.name));
            }
        }

        return this;
    }

    registerTextCommandsFolder(path = ""){
        this.textcommands = join(join(__dirname, '../'), path);
        return this;
    }

    getLogger(){
        return this.logger;
    }

    setLogger(logger = {}){
        this.logger = logger;
        return this;
    }

    clearEvents(){

        this.preload = [];
        this.commands.deleteAll();
        this.textcommands.deleteAll();
        this.configFiles.deleteAll();
        this.owners.deleteAll();

        return this;
    }

    stop(){
        this.clearEvents();
        this.client.destroy();
        return this;
    }

    boot() {
        this.registerEvents();
        this.client.login(this.config.bot.token);
        return this;
    }
}


module.exports = framework;

