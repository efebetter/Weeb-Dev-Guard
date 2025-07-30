const Discord = require("discord.js");
const fs = require("fs");
const db = require("croxydb");
const config = require("./config.json");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const {
    GatewayIntentBits,
    Partials,
    AuditLogEvent,
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

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

console.log(`[-] Detected ${fs.readdirSync("./commands").length} commands.`);

for (let commandName of fs.readdirSync("./commands")) {
    if (!commandName.endsWith(".js")) continue;

    const command = require(`./commands/${commandName}`);
    client.commands.push({
        name: command.name.toLowerCase(),
        description: command.description.toLowerCase(),
        options: command.options,
        dm_permission: false,
        type: 1
    });

    console.log(`[+] ${commandName} loaded successfully.`);
}

console.log(`[-] Detected ${fs.readdirSync("./events").length} events.`);

for (let eventName of fs.readdirSync("./events")) {
    if (!eventName.endsWith(".js")) continue;

    const event = require(`./events/${eventName}`);
    client.on(event.name, (...args) => {
        event.run(client, ...args);
    });

    console.log(`[+] ${eventName} event loaded successfully.`);
}

function addToWhitelist(guildId, userId) {
    const whitelist = db.get(`safe_users_${guildId}`) || [];
    if (!whitelist.includes(userId)) {
        whitelist.push(userId);
        db.set(`safe_users_${guildId}`, whitelist);
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

        console.log(`User action: ${userActions.count}, Limit: ${limit}`);

        if (userActions.count >= limit) {
            console.log("Limit exceeded. Banning user...");

            try {
                await guild.members.ban(user.id, { reason: reason });
                console.log(`User ${user.id} was successfully banned.`);
            } catch (error) {
                console.error(`Failed to ban user ${user.id}: ${error}`);
            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard System Warning")
                .setDescription(`${user.tag} has been banned for: ${reason}.`);

            try {
                const owner = await guild.fetchOwner();
                await owner.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Could not send message to server owner: ${error}`);
            }

            db.delete(`${dbKey}_${guild.id}_${user.id}`);
        }
    } catch (error) {
        console.error(`Error during guard handling: ${error}`);
    }
}

function isUserSafe(guild, userId) {
    const safeUsers = db.get(`safe_users_${guild.id}`) || [];
    const safeRoles = db.get(`safe_roles_${guild.id}`) || [];
    const member = guild.members.cache.get(userId);

    if (safeUsers.includes(userId)) return true;

    if (member && member.roles) {
        for (const roleId of safeRoles) {
            if (member.roles.cache.has(roleId)) return true;
        }
    }

    return false;
}

// GUARD EVENTS

client.on('channelDelete', async (channel) => {
    await handleGuardEvent(channel.guild, channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }), 'delete_channels', 'delete_channels', 'Deleting too many channels');
});

client.on('channelCreate', async (channel) => {
    await handleGuardEvent(channel.guild, channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate }), 'create_channels', 'create_channels', 'Creating too many channels');
});

client.on('roleCreate', async (role) => {
    await handleGuardEvent(role.guild, role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate }), 'create_roles', 'create_roles', 'Creating too many roles');
});

client.on('roleDelete', async (role) => {
    await handleGuardEvent(role.guild, role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete }), 'delete_roles', 'delete_roles', 'Deleting too many roles');
});

client.on('guildBanAdd', async (ban) => {
    await handleGuardEvent(ban.guild, ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd }), 'ban_members', 'ban_members', 'Banning too many members');
});

client.on('guildMemberRemove', async (member) => {
    await handleGuardEvent(member.guild, member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick }), 'kick_members', 'kick_members', 'Kicking too many members');
});

client.on('messageCreate', async (message) => {
    if (message.mentions.everyone && !message.author.bot) {
        const user = message.author;
        const guild = message.guild;
        const dbKey = 'send_everyone';
        const limitKey = 'send_everyone';
        const reason = 'Mentioning everyone too many times';

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
        console.log(`User action: ${userActions.count}, Limit: ${limit}`);

        if (userActions.count >= limit) {
            console.log("Limit exceeded. Banning user...");

            try {
                await guild.members.ban(user.id, { reason: reason });
                console.log(`User ${user.id} was successfully banned.`);
            } catch (error) {
                console.error(`Failed to ban user ${user.id}: ${error}`);
            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard System Warning")
                .setDescription(`${user.tag} has been banned for: ${reason}.`);

            try {
                const owner = await guild.fetchOwner();
                await owner.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Could not send message to server owner: ${error}`);
            }

            db.delete(`${dbKey}_${guild.id}_${user.id}`);
        }
    }
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
    try {
        const auditLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate });
        const entry = auditLogs.entries.first();
        if (entry && entry.executor && !isUserSafe(newGuild, entry.executor.id)) {
            const user = entry.executor;
            await newGuild.members.ban(user.id, { reason: 'Attempted to change server settings' });

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Guard System Warning")
                .setDescription(`${user.tag} was banned for attempting to change server settings.`);

            const owner = await newGuild.fetchOwner();
            await owner.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Error during guild update handling: ${error}`);
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
                    await member.kick('Bot added to server');
                    console.log(`Bot ${member.user.tag} was kicked because it was added by ${user.tag}.`);

                    await member.guild.members.ban(user.id, { reason: 'Added a bot' });
                    console.log(`User ${user.id} was banned for adding a bot.`);

                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Guard System Warning")
                        .setDescription(`${user.tag} was banned for adding a bot.`);

                    const owner = await member.guild.fetchOwner();
                    await owner.send({ embeds: [embed] });
                } catch (error) {
                    console.error(`Could not take action against bot/user: ${error}`);
                }
            } else {
                console.log(`Safe user ${user.tag} added a bot.`);
            }
        }
    }
});

// Voice Join Example (Optional)
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
        console.log(`${client.user.tag} is now online! 💕`);

        client.guilds.cache.forEach(guild => {
            addToWhitelist(guild.id, client.user.id);
        });
    } catch (error) {
        console.error(`Error while registering commands: ${error}`);
    }
});

client.login(config.token)
    .catch((err) => {
        console.error(`Error connecting to Discord API: ${err}`);
    });
