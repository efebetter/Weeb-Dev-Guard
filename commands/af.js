const db = require('croxydb');

module.exports = {
    name: 'af',
    description: 'Belirli bir kullanıcının limit verilerini sıfırlar.',
    type: 1,
    options: [
        {
            name: 'kullanıcı',
            description: 'Limitlerini sıfırlamak istediğiniz kullanıcının IDsi',
            type: 6, 
            required: true
        }
    ],
    run: async (client, interaction) => {
        const userId = interaction.options.getUser('kullanıcı').id;
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

        await interaction.reply(`Kullanıcı (${userId}) için limit verileri başarıyla sıfırlandı.`);
    },
};