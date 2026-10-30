const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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

// Commande pour envoyer le panneau avec le menu déroulant (tapez !setup-ticket)
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-ticket' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle("🎫 Support & Billetterie")
            .setDescription("Veuillez sélectionner le **motif de votre ticket** dans le menu déroulant ci-dessous pour contacter l'équipe.")
            .setColor("#0099ff");

        // Création du menu déroulant avec vos 4 choix exacts
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_ticket_reason')
            .setPlaceholder('Choisissez un motif de ticket...')
            .addOptions([
                {
                    label: 'RC STAFF',
                    description: 'Recrutement ou candidature Staff',
                    value: 'ticket_rc_staff',
                    emoji: '📋'
                },
                {
                    label: 'Reprise Entreprise',
                    description: 'Demande concernant la reprise d\'une entreprise',
                    value: 'ticket_reprise_entreprise',
                    emoji: '🏢'
                },
                {
                    label: 'Plainte Joueur/Staff',
                    description: 'Signaler un comportement ou faire une plainte',
                    value: 'ticket_plainte',
                    emoji: '⚖️'
                },
                {
                    label: 'Question / Aide',
                    description: 'Besoin d\'assistance ou d\'une information',
                    value: 'ticket_question',
                    emoji: '❓'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestion des interactions (Menu déroulant et Boutons)
client.on('interactionCreate', async (interaction) => {
    // 1. Si c'est une sélection dans le menu déroulant
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_ticket_reason') {
            const guild = interaction.guild;
            const user = interaction.user;
            const selectedValue = interaction.values[0];

            // Définir un nom de salon selon le choix
            let reasonName = 'aide';
            let reasonTitle = 'Question / Aide';
            
            if (selectedValue === 'ticket_rc_staff') {
                reasonName = 'rc-staff';
                reasonTitle = 'RC STAFF';
            } else if (selectedValue === 'ticket_reprise_entreprise') {
                reasonName = 'reprise-ent';
                reasonTitle = 'Reprise Entreprise';
            } else if (selectedValue === 'ticket_plainte') {
                reasonName = 'plainte';
                reasonTitle = 'Plainte Joueur/Staff';
            } else if (selectedValue === 'ticket_question') {
                reasonName = 'question';
                reasonTitle = 'Question / Aide';
            }

            // Vérifier si l'utilisateur a déjà un ticket ouvert de ce type
            const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${reasonName}-${user.username.toLowerCase()}`);
            if (existingChannel) {
                return interaction.reply({ content: `Vous avez déjà un ticket ouvert de ce type : ${existingChannel}`, ephemeral: true });
            }

            // Créer le salon privé
            const ticketChannel = await guild.channels.create({
                name: `ticket-${reasonName}-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone ne voit pas le salon
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: user.id, // L'utilisateur voit son salon
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                ],
            });

            // Message dans le nouveau ticket
            const embedTicket = new EmbedBuilder()
                .setTitle(`Ticket : ${reasonTitle}`)
                .setDescription(`Bonjour ${user}, un membre de l'équipe va vous prendre en charge.\n**Motif :** ${reasonTitle}\n\nVeuillez expliquer votre situation en détail ci-dessous.`)
                .setColor("#00ff00");

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({ content: `${user}`, embeds: [embedTicket], components: [row] });
            await interaction.reply({ content: `Votre ticket a été créé avec succès : ${ticketChannel}`, ephemeral: true });
        }
    }

    // 2. Si c'est le bouton pour fermer le ticket
    if (interaction.isButton()) {
        if (interaction.customId === 'close_ticket') {
            await interaction.reply("Fermeture du ticket dans 5 secondes...");
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
});

// Connexion au bot
client.login(process.env.DISCORD_TOKEN);
