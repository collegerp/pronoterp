const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const express = require('express');

// 1. Mini serveur web pour Render / UptimeRobot
const app = express();
app.get('/', (req, res) => res.send('Bot de Ticket en ligne !'));
app.listen(process.env.PORT || 3000, () => console.log('Serveur Web actif'));

// 2. Initialisation du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Événement quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
});

// Commande pour envoyer le panneau de ticket (ex: tapez !setup-ticket)
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle(" Support / Billetterie")
            .setDescription("Besoin d'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.")
            .setColor("#0099ff");

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Ouvrir un ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestion des interactions avec les boutons
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Création du ticket
    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
        if (existingChannel) {
            return interaction.reply({ content: `Vous avez déjà un ticket ouvert : ${existingChannel}`, ephemeral: true });
        }

        // Créer le salon privé
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone ne voit pas le salon
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id, // L'utilisateur voit le salon
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                // Optionnel : Ajoutez ici l'ID du rôle Staff pour qu'ils puissent voir le ticket
            ],
        });

        // Message dans le nouveau ticket
        const embedTicket = new EmbedBuilder()
            .setTitle(`Ticket de ${user.username}`)
            .setDescription("Un membre de l'équipe va vous répondre sous peu. Expliquez votre problème ci-dessous.")
            .setColor("#00ff00");

        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({ content: `${user}`, embeds: [embedTicket], components: [row] });
        await interaction.reply({ content: `Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });
    }

    // Fermeture du ticket
    if (interaction.customId === 'close_ticket') {
        await interaction.reply("Fermeture du ticket dans 5 secondes...");
        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

// Connexion au bot
client.login(process.env.DISCORD_TOKEN);
