const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "disable-guard",
    description: "Disables the guard system!",
    type: 1,
    run: async (client, interaction) => {
        const noPermission = new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("Insufficient Permission!")
            .setDescription("> You must be the **Server Owner** to use this command!");

        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [noPermission], ephemeral: true });
        }

        db.delete(`guard_${interaction.guild.id}`);

        const success = new Discord.EmbedBuilder()
            .setColor("Green")
            .setTitle("Guard System Disabled!")
            .setDescription("The guard system has been successfully disabled!");

        interaction.reply({ embeds: [success] });
    }
}
