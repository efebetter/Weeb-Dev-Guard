const Discord = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "güvenli-listeden-sil",
    description: "Güvenli listeden rol veya kullanıcı silin!",
    type: 1,
    options: [
        {
            name: "rol",
            description: "Güvenli listeden silinecek rol",
            type: 8, // Role type
            required: false
        },
        {
            name: "kullanıcı",
            description: "Güvenli listeden silinecek kullanıcı",
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
            let güvenliRoller = db.get(`güvenli_roller_${interaction.guild.id}`) || [];
            güvenliRoller = güvenliRoller.filter(rolId => rolId !== rol.id);
            db.set(`güvenli_roller_${interaction.guild.id}`, güvenliRoller);
            const rolSil = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Güvenli Rol Silindi!")
                .setDescription(`${rol.name} rolü güvenli listeden çıkarıldı.`);
            return interaction.reply({ embeds: [rolSil] });
        }

        if (kullanıcı) {
            let güvenliKullanıcılar = db.get(`güvenli_kullanıcılar_${interaction.guild.id}`) || [];
            güvenliKullanıcılar = güvenliKullanıcılar.filter(kullanıcıId => kullanıcıId !== kullanıcı.id);
            db.set(`güvenli_kullanıcılar_${interaction.guild.id}`, güvenliKullanıcılar);
            const kullanıcıSil = new Discord.EmbedBuilder()
                .setColor("Green")
                .setTitle("Güvenli Kullanıcı Silindi!")
                .setDescription(`${kullanıcı.tag} kullanıcısı güvenli listeden çıkarıldı.`);
            return interaction.reply({ embeds: [kullanıcıSil] });
        }

        interaction.reply("Lütfen bir rol veya kullanıcı seçin.", { ephemeral: true });
    }
}
