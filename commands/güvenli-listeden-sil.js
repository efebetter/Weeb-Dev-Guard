const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "remove-from-safe",
    description: "Remove a role or user from the safe list!",
    type: 1,
    options: [
        {
            name: "role",
            description: "The role to remove from the safe list",
            type: 8, // Role type
            required: false
        },
        {
            name: "user",
            description: "The user to remove from the safe list",
            type: 6, // User type
            required: false
        }
    ],
    run: async (client, interaction) => {
        const noPermission = new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("Insufficient Permission!")
            .setDescription("> You must be the **Server Owner** to use this command!");

        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [noPermission], ephemeral: true });
        }

        const role = interaction.options.getRole("role");
        const user = interaction.options.getUser("user");

        if (role) {
            let safeRoles = db.get(`safe_roles_${interaction.guild.id}`) || [];
            safeRoles = safeRoles.filter(roleId => roleId !== role.id);
            db.set(`safe_roles_${interaction.guild.id}`, safeRoles);
            const roleRemoved = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Safe Role Removed!")
                .setDescription(`The role **${role.name}** has been removed from the safe list.`);
            return interaction.reply({ embeds: [roleRemoved] });
        }

        if (user) {
            let safeUsers = db.get(`safe_users_${interaction.guild.id}`) || [];
            safeUsers = safeUsers.filter(userId => userId !== user.id);
            db.set(`safe_users_${interaction.guild.id}`, safeUsers);
            const userRemoved = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Safe User Removed!")
                .setDescription(`The user **${user.tag}** has been removed from the safe list.`);
            return interaction.reply({ embeds: [userRemoved] });
        }

        interaction.reply({ content: "Please select either a role or a user.", ephemeral: true });
    }
}
