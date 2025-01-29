const Discord = require("discord.js");
const fs = require("fs");
const db = require('croxydb');
const config = require("./config.json");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { GatewayIntentBits, Partials, AuditLogEvent, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message
    ],
});

global.client = client;
client.commands = (global.commands = []);

console.log(`[-] ${fs.readdirSync("./commands").length} komut algılandı.`)

for(let commandName of fs.readdirSync("./commands")) {
    if(!commandName.endsWith(".js")) continue;

    const command = require(`./commands/${commandName}`);    
    client.commands.push({
        name: command.name.toLowerCase(),
        description: command.description.toLowerCase(),
        options: command.options,
        dm_permission: false,
        type: 1
    });

    console.log(`[+] ${commandName} komutu başarıyla yüklendi.`)
}

console.log(`[-] ${fs.readdirSync("./events").length} olay algılandı.`)

for(let eventName of fs.readdirSync("./events")) {
    if(!eventName.endsWith(".js")) continue;

    const event = require(`./events/${eventName}`);    
    const event_name = eventName.split(".")[0];

    client.on(event.name, (...args) => {
        event.run(client, ...args)
    });

    console.log(`[+] ${eventName} olayı başarıyla yüklendi.`)
}

function addToWhitelist(guildId, userId) {
    const whitelist = db.get(`güvenli_kullanıcılar_${guildId}`) || [];
    if (!whitelist.includes(userId)) {
        whitelist.push(userId);
        db.set(`güvenli_kullanıcılar_${guildId}`, whitelist);
    }
}

async function handleGuardEvent(guild, auditLogsPromise, dbKey, limitKey, reason) {
    const guardLimits = config.limit;

    if (!db.has(`guard_${guild.id}`)) return;

    try {
        const auditLogs = await auditLogsPromise;
        const entry = auditLogs.entries.first();
        if (!entry || !entry.executor || entry.executor.id === client.user.id || isUserSafe(guild, entry.executor.id)) return;

        const user = entry.executor;
        const userActions = db.get(`${dbKey}_${guild.id}_${user.id}`) || { count: 0, timestamp: Date.now() };
        const currentTime = Date.now();
        
        if (currentTime - userActions.timestamp > 60000) {
            db.set(`${dbKey}_${guild.id}_${user.id}`, { count: 1, timestamp: currentTime });
        } else {
            userActions.count += 1;
            db.set(`${dbKey}_${guild.id}_${user.id}`, userActions);
        }

        const limit = guardLimits[limitKey];

        console.log(`Kullanıcı eylemi: ${userActions.count}, Limit: ${limit}`);

        if (userActions.count >= limit) {
            console.log("Limit aşıldı. Kullanıcı yasaklanıyor.");
            
            try {
                await guild.members.ban(user.id, { reason: reason });
                console.log(`Kullanıcı ${user.id} başarıyla yasaklandı.`);
            } catch (error) {
                console.error(`Kullanıcı ${user.id} yasaklanamadı: ${error}`);
            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard Sistemi Uyarısı")
                .setDescription(`${user.tag}, ${reason} nedeniyle sunucudan yasaklandı.`);

            try {
                const owner = await guild.fetchOwner();
                await owner.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Sunucu sahibine mesaj gönderilemedi: ${error}`);
            }

            db.delete(`${dbKey}_${guild.id}_${user.id}`);
        }
    } catch (error) {
        console.error(`Guard işlemi sırasında hata oluştu: ${error}`);
    }
}

function isUserSafe(guild, userId) {
    const güvenliKullanıcılar = db.get(`güvenli_kullanıcılar_${guild.id}`) || [];
    const güvenliRoller = db.get(`güvenli_roller_${guild.id}`) || [];
    const member = guild.members.cache.get(userId);

    if (güvenliKullanıcılar.includes(userId)) return true;

    if (member && member.roles) {
        for (const rolId of güvenliRoller) {
            if (member.roles.cache.has(rolId)) return true;
        }
    }

    return false;
}

client.on('channelDelete', async (channel) => {
    await handleGuardEvent(channel.guild, channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }), 'kanal_silme', 'delete_channels', 'Çok fazla kanal silme');
});

client.on('roleCreate', async (role) => {
    await handleGuardEvent(role.guild, role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate }), 'rol_oluşturma', 'create_roles', 'Çok fazla rol oluşturma');
});

client.on('roleDelete', async (role) => {
    await handleGuardEvent(role.guild, role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete }), 'rol_silme', 'delete_roles', 'Çok fazla rol silme');
});

client.on('messageCreate', async (message) => {
    if (message.mentions.everyone && !message.author.bot) {
        const user = message.author;
        const guild = message.guild;
        const dbKey = 'everyone_atma';
        const limitKey = 'send_everyone';
        const reason = 'Çok fazla everyone atma';

        if (isUserSafe(guild, user.id)) return;

        const userActions = db.get(`${dbKey}_${guild.id}_${user.id}`) || { count: 0, timestamp: Date.now() };
        const currentTime = Date.now();

        if (currentTime - userActions.timestamp > 60000) {
            db.set(`${dbKey}_${guild.id}_${user.id}`, { count: 1, timestamp: currentTime });
        } else {
            userActions.count += 1;
            db.set(`${dbKey}_${guild.id}_${user.id}`, userActions);
        }

        const limit = config.limit[limitKey];

        console.log(`Kullanıcı eylemi: ${userActions.count}, Limit: ${limit}`);

        if (userActions.count >= limit) {
            console.log("Limit aşıldı. Kullanıcı yasaklanıyor.");

            try {
                await guild.members.ban(user.id, { reason: reason });
                console.log(`Kullanıcı ${user.id} başarıyla yasaklandı.`);
            } catch (error) {
                console.error(`Kullanıcı ${user.id} yasaklanamadı: ${error}`);
            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard Sistemi Uyarısı")
                .setDescription(`${user.tag}, ${reason} nedeniyle sunucudan yasaklandı.`);

            try {
                const owner = await guild.fetchOwner();
                await owner.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Sunucu sahibine mesaj gönderilemedi: ${error}`);
            }

            db.delete(`${dbKey}_${guild.id}_${user.id}`);
        }
    }
});

client.on('channelCreate', async (channel) => {
    await handleGuardEvent(channel.guild, channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate }), 'kanal_oluşturma', 'create_channels', 'Çok fazla kanal oluşturma');
});

client.on('guildBanAdd', async (ban) => {
    await handleGuardEvent(ban.guild, ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd }), 'üye_yasaklama', 'ban_members', 'Çok fazla üye yasaklama');
});

client.on('guildMemberRemove', async (member) => {
    await handleGuardEvent(member.guild, member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick }), 'üye_atma', 'kick_members', 'Çok fazla üye atma');
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
    try {
        const auditLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate });
        const entry = auditLogs.entries.first();
        if (entry && entry.executor && !isUserSafe(newGuild, entry.executor.id)) {
            const user = entry.executor;
            await newGuild.members.ban(user.id, { reason: 'Sunucu ayarlarını değiştirme girişimi' });

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard Sistemi Uyarısı")
                .setDescription(`${user.tag}, sunucu ayarlarını değiştirmeye çalıştığı için yasaklandı.`);

            const owner = await newGuild.fetchOwner();
            await owner.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Sunucu güncelleme işlemi sırasında hata oluştu: ${error}`);
    }
});

client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) {
        const auditLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd });
        const entry = auditLogs.entries.first();
        
        if (entry && entry.target.id === member.user.id) {
            const user = entry.executor;

            if (!isUserSafe(member.guild, user.id)) {
                try {
                    await member.kick('Sunucuya bot ekledi');
                    console.log(`Bot ${member.user.tag} başarıyla sunucudan atıldı çünkü ${user.tag} tarafından eklendi.`);
                    
                    await member.guild.members.ban(user.id, { reason: 'Bot ekleme' });
                    console.log(`Kullanıcı ${user.id} başarıyla yasaklandı çünkü bot ekledi.`);
                    
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Guard Sistemi Uyarısı")
                        .setDescription(`${user.tag}, bir bot eklediği için sunucudan yasaklandı.`);
                    
                    const owner = await member.guild.fetchOwner();
                    await owner.send({ embeds: [embed] });
                } catch (error) {
                    console.error(`Bot veya kullanıcıya işlem yapılamadı: ${error}`);
                }
            } else {
                console.log(`Güvenli kullanıcı ${user.tag} bir bot ekledi.`);
            }
        }
    }
});

// const { joinVoiceChannel } = require('@discordjs/voice');
// client.on('ready', () => {
//   joinVoiceChannel({
//     channelId: "1252294134291763322",
//     guildId: "1203806689598640148",
//     adapterCreator: client.guilds.cache.get("1203806689598640148").voiceAdapterCreator
//   });
// });

client.once("ready", async () => {
    const rest = new REST({ version: "10" }).setToken(config.token);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), {
            body: client.commands,
        });
        console.log(`${client.user.tag} Aktif! 💕`);

        client.guilds.cache.forEach(guild => {
            addToWhitelist(guild.id, client.user.id);
        });
    } catch (error) {
        console.error(`Komutlar kaydedilirken hata oluştu: ${error}`);
    }
});

client.login(config.token)
    .catch((err) => {
        console.error(`Discord API'ye bağlanırken hata oluştu: ${err}`);
    });
