const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "safe-list",
    description: "View the safe list!",
    type: 1,
    run: async (client, interaction) => {
        const noPermission = new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("Insufficient Permission!")
            .setDescription("> You must be the **Server Owner** to use this command!");

        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [noPermission], ephemeral: true });
        }

        const safeRoles = db.get(`güvenli_roller_${interaction.guild.id}`) || [];
        const safeUsers = db.get(`güvenli_kullanıcılar_${interaction.guild.id}`) || [];

        const rolesList = safeRoles.map(roleId => `<@&${roleId}>`).join(", ") || "None";
        const usersList = safeUsers.map(userId => `<@${userId}>`).join(", ") || "None";

        const listEmbed = new Discord.EmbedBuilder()
            .setColor("Blue")
            .setTitle("Safe List")
            .addFields(
                { name: "Safe Roles", value: rolesList },
                { name: "Safe Users", value: usersList }
            );

        interaction.reply({ embeds: [listEmbed] });
    }
}
