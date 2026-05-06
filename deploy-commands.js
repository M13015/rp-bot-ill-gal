require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("gang-create")
.setDescription("Créer un gang")
.addStringOption(o =>
o.setName("name").setDescription("Nom du gang").setRequired(true))
.addUserOption(o =>
o.setName("lead").setDescription("Leader").setRequired(true))
.addChannelOption(o =>
o.setName("channel").setDescription("Channel du gang").setRequired(true)),

new SlashCommandBuilder()
.setName("gang-delete")
.setDescription("Supprimer un gang"),

new SlashCommandBuilder()
.setName("rep")
.setDescription("Voir ton gang + historique"),

new SlashCommandBuilder()
.setName("rep-add")
.setDescription("Ajouter points"),

new SlashCommandBuilder()
.setName("rep-remove")
.setDescription("Retirer points"),

new SlashCommandBuilder()
.setName("list")
.setDescription("Liste gangs"),

new SlashCommandBuilder()
.setName("test")
.setDescription("Test bot")

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
await rest.put(
Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
{ body: commands }
);
console.log("✅ Commands OK");
})();