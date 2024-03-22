const Framework = require('./framework');

const configFolder = "config";

const loader = new Framework()
    .setConfig(require(`./${configFolder}/config.json`))
    .setColors(require(`./${configFolder}/colors.json`))  //can be use from any where with client.framework.getColors()
    .setErrors(require(`./${configFolder}/errors.json`)) //can be use from any where with client.framework.getErrors()
    .setConfigFolder(configFolder) //client.framework.getConfig(<name>)
    .registerSlashCommandsFolder("./commands")
    .registerTextCommandsFolder("./textCommands")
    .registerHandlers("./handlers")
    .setSaveLog("./log")
    .boot();
