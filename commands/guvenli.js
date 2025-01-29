const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "güvenli",
    description: "Güvenli rol veya kullanıcı ayarlayın!",
    type: 1,
    options: [
        {
            name: "rol",
            description: "Güvenli rol ayarla",
            type: 8, // Role type
            required: false
        },
        {
            name: "kullanıcı",
            description: "Güvenli kullanıcı ayarla",
            type: 6, // User type
            required: false
        }
    ],
    run: async (client, interaction) => {
        const yetki = new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("Yetersiz Yetki!")
            .setDescription("> Bu komutu kullanabilmek için `Sunucu Sahibi` olmalısın!");

        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [yetki], ephemeral: true });
        }

        const rol = interaction.options.getRole("rol");
        const kullanıcı = interaction.options.getUser("kullanıcı");

        if (rol) {
            db.push(`güvenli_roller_${interaction.guild.id}`, rol.id);
            const rolEkle = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Güvenli Rol Eklendi!")
                .setDescription(`${rol.name} rolü güvenli olarak eklendi.`);
            return interaction.reply({ embeds: [rolEkle] });
        }

        if (kullanıcı) {
            db.push(`güvenli_kullanıcılar_${interaction.guild.id}`, kullanıcı.id);
            const kullanıcıEkle = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Güvenli Kullanıcı Eklendi!")
                .setDescription(`${kullanıcı.tag} kullanıcısı güvenli olarak eklendi.`);
            return interaction.reply({ embeds: [kullanıcıEkle] });
        }

        interaction.reply("Lütfen bir rol veya kullanıcı seçin.", { ephemeral: true });
    }
}
