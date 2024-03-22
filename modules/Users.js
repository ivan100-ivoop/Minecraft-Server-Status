const mongoose = require("mongoose");

module.exports = mongoose.model("Users", new mongoose.Schema({
    id: { type: Number },
    username: { type: String, default: ""},
    email: { type: String, default: ""},
    password: { type: String, default: ""},
    panelID: { type: Number, default: 0},
    max: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    servers: { type: Array, default: []},
    ban: { type: Boolean, default: false },
    registeredAt: { type: Number, default: Date.now() },
}));