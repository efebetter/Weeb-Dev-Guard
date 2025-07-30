const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "safe",
    description: "Add a safe role or user!",
    type: 1,
    options: [
        {
            name: "role",
            description: "Set a safe role",
            type: 8, // Role type
            required: false
        },
        {
            name: "user",
            description: "Set a safe user",
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
            db.push(`safe_roles_${interaction.guild.id}`, role.id);
            const roleAdded = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Safe Role Added!")
                .setDescription(`The role **${role.name}** has been added to the safe list.`);
            return interaction.reply({ embeds: [roleAdded] });
        }

        if (user) {
            db.push(`safe_users_${interaction.guild.id}`, user.id);
            const userAdded = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Safe User Added!")
                .setDescription(`The user **${user.tag}** has been added to the safe list.`);
            return interaction.reply({ embeds: [userAdded] });
        }

        interaction.reply({ content: "Please select either a role or a user.", ephemeral: true });
    }
}
