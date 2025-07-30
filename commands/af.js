const db = require('croxydb');

module.exports = {
    name: 'reset-limits',
    description: 'Resets the limit data for a specific user.',
    type: 1,
    options: [
        {
            name: 'user',
            description: 'The ID of the user whose limits you want to reset.',
            type: 6,
            required: true
        }
    ],
    run: async (client, interaction) => {
        const userId = interaction.options.getUser('user').id;
        const guildId = interaction.guild.id;

        db.delete(`everyone_atma_${guildId}_${userId}`);
        db.delete(`send_everyone_${guildId}_${userId}`);
        db.delete(`kanal_silme_${guildId}_${userId}`);
        db.delete(`delete_channels_${guildId}_${userId}`);
        db.delete(`rol_oluşturma_${guildId}_${userId}`);
        db.delete(`create_roles_${guildId}_${userId}`);
        db.delete(`kanal_oluşturma_${guildId}_${userId}`);
        db.delete(`create_channels_${guildId}_${userId}`);
        db.delete(`üye_yasaklama_${guildId}_${userId}`);
        db.delete(`ban_members_${guildId}_${userId}`);
        db.delete(`üye_atma_${guildId}_${userId}`);
        db.delete(`kick_members_${guildId}_${userId}`);

        await interaction.reply(`Limit data for the user (${userId}) has been successfully reset.`);
    },
};
