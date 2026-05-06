const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connecté"))
.catch(err => console.log("❌ DB error", err));

const Gang = mongoose.model("Gang", new mongoose.Schema({
name: String,
type: String,
points: { type: Number, default: 0 },
leader: String,
channel: String
}));

const Log = mongoose.model("Log", new mongoose.Schema({
gang: String,
type: String,
points: Number,
reason: String,
staff: String,
date: String
}));

module.exports = { Gang, Log };