const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "enable-guard",
    description: "Enables the guard system!",
    type: 1,
    run: async (client, interaction) => {
        const noPermission = new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("Insufficient Permission!")
            .setDescription("> You must be the **Server Owner** to use this command!");

        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [noPermission], ephemeral: true });
        }

        db.set(`guard_${interaction.guild.id}`, true);

        const success = new Discord.EmbedBuilder()
            .setColor("Green")
            .setTitle("Guard System Enabled!")
            .setDescription("The guard system has been successfully enabled!");

        interaction.reply({ embeds: [success] });
    }
}
