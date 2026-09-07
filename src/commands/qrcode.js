const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const command = require('../../../../main/discord/core/commands/command.js');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');

module.exports = class qrcode extends command {
    constructor(heart) {
        super(heart, {
            name: 'qrcode',
            data: new SlashCommandBuilder()
                .setName('qrcode')
                .setDescription('Generate custom QR codes')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('make')
                        .setDescription('Generate a cool QR code with an optional logo')
                        .addStringOption(option =>
                            option.setName('data')
                                .setDescription('The data to encode in the QR code')
                                .setRequired(true))
                        .addAttachmentOption(option =>
                            option.setName('logo')
                                .setDescription('An optional logo to put in the center (SVG/PNG/JPG)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('color')
                                .setDescription('The color of the QR code (Hex code)')
                                .setRequired(false))
                        .addBooleanOption(option =>
                            option.setName('rounded')
                                .setDescription('Whether to use rounded dots')
                                .setRequired(false))
                ),
            contextMenu: false,
            global: true,
            category: 'utility',
            bypass: true,
            permissionLevel: heart.core.discord.core.config.manager.get('qrCodes').get().config.permissions.qrcode_command,
        });
    }

    async execute(interaction) {
        await interaction.deferReply();

        const pluginConfig = this.heart.core.discord.core.config.manager.get('qrCodes').get().config;
        const config = pluginConfig.qrOptions;
        const lang = pluginConfig.lang;

        const data = interaction.options.getString('data');
        const logoAttachment = interaction.options.getAttachment('logo');
        const userColor = interaction.options.getString('color') ?? config.color.dark;
        const isRounded = interaction.options.getBoolean('rounded') ?? config.roundedDots;

        try {
            const qr = QRCode.create(data, { errorCorrectionLevel: config.errorCorrectionLevel });
            const modules = qr.modules;
            const moduleCount = modules.size;
            const margin = config.margin;
            const scale = config.scale;
            const size = (moduleCount + margin * 2) * scale;

            const canvas = createCanvas(size, size);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = config.color.light;
            ctx.fillRect(0, 0, size, size);

            ctx.fillStyle = userColor;
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (!modules.get(row, col)) continue;

                    const x = (col + margin) * scale;
                    const y = (row + margin) * scale;
                    const isFinder = (row < 7 && col < 7) || (row < 7 && col >= moduleCount - 7) || (row >= moduleCount - 7 && col < 7);

                    if (isRounded && !isFinder) {
                        ctx.beginPath();
                        ctx.arc(x + scale / 2, y + scale / 2, scale * 0.42, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillRect(x, y, scale, scale);
                    }
                }
            }

            if (logoAttachment) {
                try {
                    const logo = await loadImage(logoAttachment.url);
                    const logoSize = size * 0.22;
                    const x = (size - logoSize) / 2;
                    const y = (size - logoSize) / 2;

                    ctx.save();
                    ctx.beginPath();

                    if (isRounded) {
                        ctx.roundRect(x - 5, y - 5, logoSize + 10, logoSize + 10, scale);
                    } else {
                        ctx.rect(x - 5, y - 5, logoSize + 10, logoSize + 10);
                    }

                    ctx.fillStyle = config.color.light;
                    ctx.fill();
                    ctx.restore();

                    ctx.drawImage(logo, x, y, logoSize, logoSize);
                } catch (logoErr) {
                    this.heart.core.console.log(this.heart.core.console.type.error, `Failed to load logo from ${logoAttachment.url}`);
                }
            }

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'qrcode.png' });

            const successEmbed = this.heart.core.util.discord.resolveEmbed(
                lang.successEmbed,
                { "data": data },
                interaction.guild,
                interaction.user
            );

            successEmbed.setImage('attachment://qrcode.png');

            await interaction.editReply({
                embeds: [successEmbed],
                files: [attachment]
            });

        } catch (err) {
            new this.heart.core.error.interface(this.heart, err);

            const errorEmbed = this.heart.core.util.discord.generateErrorEmbed(lang.errorInvalidData);
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};