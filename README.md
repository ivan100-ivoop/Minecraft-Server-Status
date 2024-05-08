
# Minecraft-Status

Simple Discord Bot for Minecraft live status

## Deployment

|      info         |         command         |
| ------------------|-------------------------|
|    install pkg    |       npm install       |
|        run        |      node index.js      |
|        run        |       npm run start     |
|        run        |           node .        |

## /config/minecraft.json

```json
{
	"updateTime": 2500, # update time to ping 
	"log_channel": "", #status channel ID
	"web": "", #link to web site
	"list": [ # server's list
		{
			"ip": "", #server IP
			"port": "", #server PORT
			"address": "", #server address to be show in embet of users
			"title": "", #name of server
			"support": "1.8 - 1.20.4" #support version 
		},#example of next server
		{
			"ip": "",
			"port": "",
			"address": "",
			"title": "",
			"support": "1.8 - 1.20.4"
		}
	]
}
```

## /config/config.json
```json
{
	"save_log": false, //auto create and save console log in log folder
	"textcommand_prefix": "!", //textcommands prefix default !.
	"bot": {
		"token": "", //bot token
		"application_id": "", //bot id
		"activity": { //activity: playing, listening, competing, empty for watching.
			"enabled": true,
			"type": "playing",
			"message": "Games" //message in activity.
		}
	},
	"guilds": [], //server's ID
	"tag_on_error": {
		"enabled": false, /
		"log_channel": [] // chanel to be tag if have some errors!
	}
}
```

## /config/mongo/MongoConnect.json
```json
{
   "url": "", //mongo db connect url
}
```

## Useful Links

[MogoDB](https://cloud.mongodb.com/)

[Easy-Discord-Bot](https://github.com/ivan100-ivoop/Easy-Discord-Bot)

## Screenshots

![preview](https://raw.githubusercontent.com/ivan100-ivoop/Minecraft-Server-Status/main/images/image_1.png)
