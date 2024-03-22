const mongoose = require('mongoose');

module.exports = {
    run: async (client) => {
        mongoose.set('strictQuery', true);

        const config = client.framework.getConfig("MongoConnect");
        const logger = client.framework.getLogger();

        if(!config.url) return;

        await mongoose.connect(config.url).then(() => {
            logger.info('Connected successfully to MongoDB server!')
        }).catch((err) => {
            logger.error(`Unable to connect to MongoDB Database.\nError: ${err}`)
        })
    }
}