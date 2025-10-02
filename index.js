require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActivityType,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || null;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.BOT_TOKEN;
const LOG_CHANNEL_ID = "1360422935663345905"; // salon de logs

if (!TOKEN || !GUILD_ID) {
  console.error("❌ BOT_TOKEN et GUILD_ID sont obligatoires dans .env");
  process.exit(1);
}

/* =========================
   CONFIG RECRUTEMENTS (🟢/🔴 + membres)
   - open: true -> 🟢 et visible dans le menu
   - open: true -> 🔴 et caché du menu
========================= */
const recruitments = [
  { label: "Modération",           value: "moderation",     emoji: "🛡️", members: 0, open: true },
  { label: "Animation",            value: "animation",      emoji: "🎉", members: 0, open: true },
  { label: "MJ",                   value: "mj",             emoji: "📜", members: 0, open: true },
  { label: "Douane",               value: "douane",         emoji: "🛂", members: 0, open: true },
  { label: "Builders",             value: "builders",       emoji: "🧱", members: 0, open: true },
  { label: "Développeurs",         value: "dev",            emoji: "💻", members: 0, open: true },
  { label: "Modélisateurs",        value: "model",          emoji: "🎨", members: 0, open: true },
  { label: "Community Manager",    value: "cm",             emoji: "📢", members: 0, open: true },
  { label: "Lore",                 value: "lore",           emoji: "📖", members: 0, open: true }
];

/* =========================
   COMMANDES SLASH
========================= */
const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("Envoie le menu de tickets"),
  new SlashCommandBuilder()
    .setName("add")
    .setDescription("Ajoute un membre au ticket")
    .addUserOption(opt => opt.setName("membre").setDescription("Le membre à ajouter").setRequired(true)),
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Retire un membre du ticket")
    .addUserOption(opt => opt.setName("membre").setDescription("Le membre à retirer").setRequired(true)),
  new SlashCommandBuilder()
    .setName("rename")
    .setDescription("Renomme le ticket")
    .addStringOption(opt => opt.setName("nom").setDescription("Nouveau nom du ticket").setRequired(true)),
  new SlashCommandBuilder().setName("delete").setDescription("Fermer et supprimer le ticket"),
  new SlashCommandBuilder().setName("informations").setDescription("Affiche toutes les infos de Silent"),
  new SlashCommandBuilder().setName("staff").setDescription("Affiche la liste des contacts du staff"),
  new SlashCommandBuilder().setName("recrutement").setDescription("Affiche le menu des recrutements staff")
].map(c => c.toJSON());

async function registerCommands(appId) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(appId, GUILD_ID), { body: commands });
  console.log("✅ Commandes slash enregistrées.");
}

/* =========================
   READY
========================= */
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  try {
    await registerCommands(client.user.id);
  } catch (err) {
    console.error("❌ Erreur d'enregistrement des commandes :", err);
  }

  // --- Mise à jour auto du statut ---
  const guild = client.guilds.cache.get(GUILD_ID);
  if (guild) {
    const updateActivity = () => {
      const memberCount = guild.memberCount;
      client.user.setActivity(`👥 ${memberCount} membres  `, { type: ActivityType.Watching });
    };

    updateActivity();
    setInterval(updateActivity, 60 * 1000);
  }
});

/* =========================
   COMMANDES
========================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- /ticket (identique à ton code) ---
  if (interaction.commandName === "ticket") {
    const embed = new EmbedBuilder()
      .setTitle("📩 Ouvrir un ticket auprès du staff")
      .setDescription(
        "**Comment ça marche ?**\n" +
        "> 1 Sélectionnez votre raison dans le menu ci-dessous.\n" +
        "> 2 Une demande sera envoyée au staff.\n" +
        "> 3 Vous recevrez un MP quand votre ticket sera accepté.\n\n" +
        "**Règles de courtoisie :**\n" +
        "> • Merci de rester poli et respectueux.\n" +
        "> • Toute forme de harcèlement est interdite."
      )
      .setColor(0x3498db);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket-menu")
      .setPlaceholder("Choisissez la raison de votre ticket")
      .addOptions(
        { label: "Rejoindre l'équipe de modération", value: "moderation", emoji: "1358449035119300688" },
        { label: "Rejoindre l'équipe d'animation", value: "animation", emoji: "1358448878755516486" },
        { label: "Soucis concernant la boutique", value: "boutique", emoji: "1358447734033485918" },
        { label: "Autres demandes / questions", value: "autre", emoji: "1358448365548863609" }
      );

    const row = new ActionRowBuilder().addComponents(menu);
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // --- /informations (identique à ton code) ---
  if (interaction.commandName === "informations") {
    const embed1 = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("📖 Informations — Silent <:Silent:1411002580318031992>")
      .setDescription(
        "• Hub de Connexion : ``🔴 Non disponible``\n" +
        "• Collection : ``🔴 Non disponible``\n" +
        "• Boutique : ``🔴 Non disponible``\n" +
        "• Wiki : ``🔴 Non disponible``\n" +
        "──────────────────────────────\n" +
        "*Les informations que vous retrouvez ici peuvent être modifiées à n'importe quel moment,*\n" +
        "*vous recevrez une mention si une modification a eu lieu.*"
      )
      .setImage("https://cdn.discordapp.com/attachments/1353566756685221998/1410213225596846160/image.png?ex=68b2d5e9&is=68b18469&hm=32b61e77904ec83bf4c8c073c64724c3d42c9dea5e6d76e021bbcbf25486fe70&");

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🌐 Site internet")
        .setStyle(ButtonStyle.Link)
        .setURL("https://ton-site.com")
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel("🛠️ Installer la collection (workshop)")
        .setStyle(ButtonStyle.Link)
        .setURL("https://steamcommunity.com/sharedfiles/xxxxx")
        .setDisabled(true)
    );

    const embed2 = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("<:silent_logo:1358697409202356374> Serveurs Discord — Silent")
      .setDescription(
        "<:Konohagakure:1359429191522717786> **Konoha** : [Rejoindre le serveur Discord](https://discord.gg/JQBr5pBfAT)\n" +
        "<:Sunagakure:1359429274850955304> **Suna** : [Rejoindre le serveur Discord](https://discord.gg/P4vyDCRWay)"
      );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🔥 Rejoindre Suna")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/P4vyDCRWay"),
      new ButtonBuilder()
        .setLabel("🍃 Rejoindre Konoha")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/JQBr5pBfAT")
    );

    return interaction.reply({ embeds: [embed1, embed2], components: [row1, row2] });
  }

  // --- /staff (identique à ton code) ---
  if (interaction.commandName === "staff") {
    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("> <:silent_logo:1358697409202356374> Qui contacter ?")
      .setDescription(
        "Si votre problème ne peut pas être résolu via un ticket ou nécessite un contact direct, référez-vous aux listings ci-dessous.\n\n" +
        "> <:JirayaShock:1358449186151862373> **Vigilance**\n" +
        "Merci de ne **pas MP** directement un membre de la <@&1353536899368616048> pour un problème réglable par un <@&1353547825040064542>.\n\n" +
        "<:checkmark:1360389936146022526> **Staff pouvant être contacté**"
      )
      .addFields(
        { name: "<:Hokage:1412061088366723093> Coordinateur", value: "> • <@1045073761021481070>\n" },
        { name: "<:cyclone:1412058581259386941> Gérant Serveur\n> *Problème serveur*", value: "> • <@1081987507744411688>\n> • <@591729112012423178>\n" },
        { name: "<:GRP:1412062427738148936> Gérant RP\n> *Problème RP*", value: "> • <@444131739493990410>\n" }
      )
      .setFooter({ text: "➡️ Pour tout problème impliquant un staff ou un sujet sensible, ouvrez un ticket via le salon 📌・ticket (Entretien avec la Direction)." });

    return interaction.reply({ embeds: [embed] });
  }

  // --- /recrutement (NOUVEAU, style “photo”) ---
  if (interaction.commandName === "recrutement") {
    const lines = recruitments.map(r => {
      const dot = r.open ? "🟢" : "🔴";
      const statut = r.open ? "Ouvert" : "Fermé";
      return `${dot} ${r.emoji} **${r.label}**\nStatut: ${statut}\nMembres: ${r.members}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("Silent • Naruto : Recrutements Staff")
      .setThumbnail("https://cdn.discordapp.com/attachments/1353566756685221998/1410213225596846160/image.png") // logo en haut
      .setDescription(lines.join("\n\n") + "\n\n⚠️ **Condition**\n*Jeu sous autorité | Silent • Naruto*");

    // Menu seulement si des postes sont ouverts
    const openRecruitments = recruitments.filter(r => r.open);
    const components = [];

    if (openRecruitments.length > 0) {
      const menu = new StringSelectMenuBuilder()
        .setCustomId("recrutement-menu")
        .setPlaceholder("Choisissez un poste disponible")
        .addOptions(
          openRecruitments.map(r => ({
            label: r.label,
            value: r.value,
            emoji: r.emoji
          }))
        );
      components.push(new ActionRowBuilder().addComponents(menu));
    }

    return interaction.reply({ embeds: [embed], components });
  }

  // --- /add ---
  if (interaction.commandName === "add") {
    const member = interaction.options.getUser("membre");
    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    return interaction.reply({ content: `✅ ${member} a été ajouté au ticket.`, ephemeral: true });
  }

  // --- /remove ---
  if (interaction.commandName === "remove") {
    const member = interaction.options.getUser("membre");
    await interaction.channel.permissionOverwrites.delete(member.id);
    return interaction.reply({ content: `✅ ${member} a été retiré du ticket.`, ephemeral: true });
  }

  // --- /rename ---
  if (interaction.commandName === "rename") {
    const newName = interaction.options.getString("nom");
    await interaction.channel.setName(newName);
    return interaction.reply({ content: `✅ Le ticket a été renommé en **${newName}**.`, ephemeral: true });
  }

  // --- /delete (identique à ton code, transcript + logs + suppression) ---
  if (interaction.commandName === "delete") {
    let messages = [];
    let lastId;
    while (true) {
      const fetched = await interaction.channel.messages.fetch({ limit: 100, before: lastId });
      if (fetched.size === 0) break;
      messages = messages.concat(Array.from(fetched.values()));
      lastId = fetched.last().id;
    }
    messages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let transcript = `--- Transcript du ticket ${interaction.channel.name} ---\n\n`;
    for (const msg of messages) {
      const time = new Date(msg.createdTimestamp).toLocaleString("fr-FR");
      transcript += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
      if (msg.attachments.size > 0) {
        transcript += `   📎 Fichiers: ${msg.attachments.map(a => a.url).join(", ")}\n`;
      }
    }
    const filePath = `./transcript-${interaction.channel.id}.txt`;
    fs.writeFileSync(filePath, transcript);

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("📑 Ticket fermé")
            .setColor(0xff0000)
            .addFields(
              { name: "Salon", value: interaction.channel.name },
              { name: "Fermé par", value: interaction.user.toString() },
              { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            )
        ],
        files: [filePath]
      });
    }

    await interaction.reply({ content: "🗑️ Le ticket va être supprimé dans 3s...", ephemeral: true });
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
      fs.unlinkSync(filePath);
    }, 3000);
  }
});

/* =========================
   MENUS (Tickets + Recrutements)
========================= */

// --- Création du ticket via menu (identique à ton code) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket-menu") return;

  const guild = interaction.guild;
  const user = interaction.user;
  const reason = interaction.values[0];
  const channelName = `${user.username}-${reason}`;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `ticket-owner:${user.id}|reason:${reason}`,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]
  });

  await channel.send(`🎫 Ticket ouvert par ${user}\nCatégorie : **${reason}**\n<@&${STAFF_ROLE_ID}>`);
  await interaction.reply({ content: `✅ Ton ticket a été créé : ${channel}`, ephemeral: true });
});

// --- Création du ticket de recrutement via menu (NOUVEAU) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "recrutement-menu") return;

  const choix = interaction.values[0];
  const recrutement = recruitments.find(r => r.value === choix);

  if (!recrutement || !recrutement.open) {
    return interaction.reply({
      content: "❌ Ce recrutement n'est pas disponible.",
      ephemeral: true
    });
  }

  const guild = interaction.guild;
  const user = interaction.user;
  const channelName = `${recrutement.value}-${user.username}`.toLowerCase();

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Recrutement: ${recrutement.label} | Candidat: ${user.tag}`,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ]
  });

  await channel.send(`📋 **Recrutement ${recrutement.label}**\n👤 Candidat : ${user}\n<@&${STAFF_ROLE_ID}>`);
  await interaction.reply({ content: `✅ Ton ticket de recrutement a été créé : ${channel}`, ephemeral: true });
});

/* =========================
   LOGIN
========================= */
client.login(TOKEN);
