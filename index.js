require("dotenv").config();

const {
Client,
GatewayIntentBits,
EmbedBuilder,
StringSelectMenuBuilder,
ActionRowBuilder,
ModalBuilder,
TextInputBuilder,
TextInputStyle
} = require("discord.js");

const db = require("./database");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
console.log("✅ BOT ONLINE");
setInterval(updateRank, 30000);
});

/* ================= ADMIN ================= */

function isAdmin(interaction) {
return interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID);
}

/* ================= LOG STAFF ================= */

function log(text, user) {
const channel = client.channels.cache.get(process.env.LOG_CHANNEL);
if (!channel) return;

const embed = new EmbedBuilder()
.setColor("#FFA500")
.setDescription(`📜 ${text}`)
.setFooter({
text: user.tag,
iconURL: user.displayAvatarURL()
})
.setTimestamp();

channel.send({ embeds: [embed] });
}

/* ================= LOG GANG ================= */

function sendGangLog(gangName, text) {

db.get("SELECT channel FROM gangs WHERE name = ?", [gangName], (err,row) => {

if (!row) return;

const channel = client.channels.cache.get(row.channel);
if (!channel) return;

const embed = new EmbedBuilder()
.setColor("#FFA500")
.setTitle(`📢 ${gangName}`)
.setDescription(text)
.setTimestamp();

channel.send({ embeds:[embed] });

});
}

/* ================= CLASSEMENT ================= */

let rankMessageId = null;

async function updateRank() {

const channel = client.channels.cache.get(process.env.RANK_CHANNEL);
if (!channel) return;

db.all("SELECT * FROM gangs ORDER BY points DESC", async (err, rows) => {

let desc = "";

if (!rows || rows.length === 0) {
desc = "❌ Aucun gang";
} else {
const medals = ["🥇","🥈","🥉"];
rows.forEach((g,i) => {
desc += `${medals[i] || "🏅"} **${g.name}** | ${g.type} | ⭐ ${g.points}\n`;
});
}

const embed = new EmbedBuilder()
.setColor("#FFA500")
.setTitle("🏆 CLASSEMENT GANGS")
.setDescription(desc);

try {
if (rankMessageId) {
const msg = await channel.messages.fetch(rankMessageId);
return msg.edit({ embeds: [embed] });
}
const msg = await channel.send({ embeds: [embed] });
rankMessageId = msg.id;
} catch {}
});
}

/* ================= BOT ================= */

client.on("interactionCreate", async interaction => {

if (!interaction.isChatInputCommand() &&
!interaction.isStringSelectMenu() &&
!interaction.isModalSubmit()) return;

/* ================= TEST ================= */

if (interaction.commandName === "test") {
return interaction.reply("✅ OK");
}

/* ================= LIST ================= */

if (interaction.commandName === "list") {

await interaction.deferReply({ ephemeral: true });

db.all("SELECT * FROM gangs ORDER BY points DESC", (err, rows) => {

if (!rows || rows.length === 0)
return interaction.editReply("❌ aucun gang");

let desc = "";
const medals = ["🥇","🥈","🥉"];

rows.forEach((g,i) => {
desc += `${medals[i] || "🏅"} **${g.name}** (${g.type}) — ⭐ ${g.points}\n`;
});

interaction.editReply({
embeds: [
new EmbedBuilder()
.setColor("#FFA500")
.setTitle("📊 LISTE DES GANGS")
.setDescription(desc)
]
});
});
}

/* ================= REP AVEC HISTORIQUE ================= */

if (interaction.commandName === "rep") {

await interaction.deferReply({ ephemeral:true });

db.get("SELECT * FROM gangs WHERE leader = ?", [interaction.user.id], (err,gang) => {

if (!gang)
return interaction.editReply("❌ Tu n'es pas leader");

db.all(
"SELECT * FROM history WHERE gang = ? ORDER BY id DESC LIMIT 10",
[gang.name],
(err,rows) => {

let historyText = "";

if (!rows || rows.length === 0) {
historyText = "Aucun historique";
} else {
rows.forEach(h => {
historyText += `• ${h.action === "add" ? "➕" : "➖"} ${h.points} | ${h.reason} (<@${h.staff}>)\n`;
});
}

interaction.editReply({
embeds:[
new EmbedBuilder()
.setColor("#FFA500")
.setTitle(`🏴 ${gang.name}`)
.setDescription(
`Type: ${gang.type}\nPoints: ⭐ ${gang.points}\n\n📜 Historique :\n${historyText}`
)
]
});
});
});
}

/* ================= CREATE ================= */

if (interaction.commandName === "gang-create") {

if (!isAdmin(interaction))
return interaction.reply({ content:"❌ pas accès", ephemeral:true });

const name = interaction.options.getString("name");
const lead = interaction.options.getUser("lead");
const channel = interaction.options.getChannel("channel");

const menu = new StringSelectMenuBuilder()
.setCustomId(`create_${name}_${lead.id}_${channel.id}`)
.addOptions(
{ label:"PF", value:"pf" },
{ label:"Gang", value:"gang" },
{ label:"MC", value:"mc" },
{ label:"Org", value:"org" }
);

return interaction.reply({
components:[new ActionRowBuilder().addComponents(menu)],
ephemeral:true
});
}

/* ================= SAVE CREATE ================= */

if (interaction.isStringSelectMenu() && interaction.customId.startsWith("create_")) {

const parts = interaction.customId.split("_");

const name = parts[1];
const lead = parts[2];
const channel = parts[3];
const type = interaction.values[0];

db.run(
"INSERT INTO gangs(name,type,points,leader,channel) VALUES (?,?,?,?,?)",
[name,type,0,lead,channel]
);

log(`🏴 ${name} créé`, interaction.user);
updateRank();

return interaction.update({ content:"✔ créé", components:[] });
}

/* ================= DELETE ================= */

if (interaction.commandName === "gang-delete") {

if (!isAdmin(interaction))
return interaction.reply({ content:"❌ pas accès", ephemeral:true });

await interaction.deferReply({ ephemeral:true });

db.all("SELECT * FROM gangs", (err,rows) => {

const menu = new StringSelectMenuBuilder()
.setCustomId("delete");

rows.slice(0,25).forEach(g =>
menu.addOptions({ label:g.name, value:g.name })
);

interaction.editReply({
components:[new ActionRowBuilder().addComponents(menu)]
});
});
}

if (interaction.isStringSelectMenu() && interaction.customId === "delete") {

const name = interaction.values[0];

db.run("DELETE FROM gangs WHERE name = ?", [name]);

log(`🗑 ${name} supprimé`, interaction.user);
updateRank();

return interaction.update({ content:"✔ supprimé", components:[] });
}

/* ================= ADD ================= */

if (interaction.commandName === "rep-add") {

if (!isAdmin(interaction))
return interaction.reply({ content:"❌ pas accès", ephemeral:true });

await interaction.deferReply({ ephemeral:true });

db.all("SELECT * FROM gangs", (err,rows) => {

const menu = new StringSelectMenuBuilder()
.setCustomId("add_select");

rows.slice(0,25).forEach(g =>
menu.addOptions({ label:g.name, value:g.name })
);

interaction.editReply({
components:[new ActionRowBuilder().addComponents(menu)]
});
});
}

/* ================= REMOVE ================= */

if (interaction.commandName === "rep-remove") {

if (!isAdmin(interaction))
return interaction.reply({ content:"❌ pas accès", ephemeral:true });

await interaction.deferReply({ ephemeral:true });

db.all("SELECT * FROM gangs", (err,rows) => {

const menu = new StringSelectMenuBuilder()
.setCustomId("remove_select");

rows.slice(0,25).forEach(g =>
menu.addOptions({ label:g.name, value:g.name })
);

interaction.editReply({
components:[new ActionRowBuilder().addComponents(menu)]
});
});
}

/* ================= MODALS ================= */

if (interaction.isStringSelectMenu() && interaction.customId === "add_select") {

const gang = interaction.values[0];

const modal = new ModalBuilder()
.setCustomId(`add_${gang}`)
.setTitle("Ajouter points");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder().setCustomId("points").setLabel("Points").setStyle(TextInputStyle.Short)
),
new ActionRowBuilder().addComponents(
new TextInputBuilder().setCustomId("reason").setLabel("Raison").setStyle(TextInputStyle.Paragraph)
)
);

return interaction.showModal(modal);
}

if (interaction.isStringSelectMenu() && interaction.customId === "remove_select") {

const gang = interaction.values[0];

const modal = new ModalBuilder()
.setCustomId(`remove_${gang}`)
.setTitle("Retirer points");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder().setCustomId("points").setLabel("Points").setStyle(TextInputStyle.Short)
),
new ActionRowBuilder().addComponents(
new TextInputBuilder().setCustomId("reason").setLabel("Raison").setStyle(TextInputStyle.Paragraph)
)
);

return interaction.showModal(modal);
}

/* ================= SAVE ADD ================= */

if (interaction.isModalSubmit() && interaction.customId.startsWith("add_")) {

const gang = interaction.customId.replace("add_","");
const points = parseInt(interaction.fields.getTextInputValue("points"));
const reason = interaction.fields.getTextInputValue("reason");

db.run("UPDATE gangs SET points = points + ? WHERE name = ?", [points, gang]);

db.run(
"INSERT INTO history(gang,action,points,reason,staff,date) VALUES (?,?,?,?,?,?)",
[gang,"add",points,reason,interaction.user.id,new Date().toLocaleString()]
);

sendGangLog(gang, `➕ +${points}\n📌 ${reason}`);
updateRank();

return interaction.reply({ content:"✔ ajouté", ephemeral:true });
}

/* ================= SAVE REMOVE ================= */

if (interaction.isModalSubmit() && interaction.customId.startsWith("remove_")) {

const gang = interaction.customId.replace("remove_","");
const points = parseInt(interaction.fields.getTextInputValue("points"));
const reason = interaction.fields.getTextInputValue("reason");

db.run("UPDATE gangs SET points = points - ? WHERE name = ?", [points, gang]);

db.run(
"INSERT INTO history(gang,action,points,reason,staff,date) VALUES (?,?,?,?,?,?)",
[gang,"remove",points,reason,interaction.user.id,new Date().toLocaleString()]
);

sendGangLog(gang, `➖ -${points}\n📌 ${reason}`);
updateRank();

return interaction.reply({ content:"✔ retiré", ephemeral:true });
}

});

client.login(process.env.TOKEN);