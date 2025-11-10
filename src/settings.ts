import { App, PluginSettingTab, Setting } from "obsidian";
import TranscribePlugin from "./main";

export interface TranscribeSettings {
    openaiApiKey: string;
    maxTokens: number;
    model: string;
    language: string;
}

export const DEFAULT_SETTINGS: TranscribeSettings = {
    openaiApiKey: "",
    maxTokens: 4096,
    model: "whisper-1",
    language: "auto"
}

export class TranscribeSettingTab extends PluginSettingTab {
    plugin: TranscribePlugin;

    constructor(app: App, plugin: TranscribePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Transcribe Settings" });

        new Setting(containerEl)
            .setName("OpenAI API Key")
            .setDesc("Enter your OpenAI API key for Whisper transcription")
            .addText(text => text
                .setPlaceholder("sk-...")
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl("p", {
            text: "You can get your API key from https://platform.openai.com/api-keys",
            cls: "setting-item-description"
        });

        // Model selection
        new Setting(containerEl)
            .setName("Model")
            .setDesc("Select the Whisper model to use for transcription")
            .addDropdown(dropdown => {
                dropdown
                    .addOption("whisper-1", "whisper-1")
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Language selection
        const languageOptions: Record<string, string> = {
            "auto": "Auto-detect",
            "en": "English",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "ru": "Russian",
            "ja": "Japanese",
            "ko": "Korean",
            "zh": "Chinese",
            "ar": "Arabic",
            "hi": "Hindi",
            "nl": "Dutch",
            "pl": "Polish",
            "sv": "Swedish",
            "tr": "Turkish",
            "vi": "Vietnamese"
        };

        new Setting(containerEl)
            .setName("Language")
            .setDesc("Select the language of the audio (or auto-detect)")
            .addDropdown(dropdown => {
                Object.entries(languageOptions).forEach(([code, name]) => {
                    dropdown.addOption(code, name);
                });
                dropdown
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value) => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Max tokens with estimated words
        let estimatedWordsEl: HTMLElement;

        const updateEstimatedWords = (tokens: number) => {
            // Rough estimate: 1 token ≈ 0.75 words
            const estimatedWords = Math.round(tokens * 0.75);
            if (estimatedWordsEl) {
                estimatedWordsEl.textContent = `Estimated words: ~${estimatedWords.toLocaleString()}`;
            }
        };

        new Setting(containerEl)
            .setName("Max Tokens")
            .setDesc("Maximum tokens for transcription output (Note: Whisper API doesn't use this parameter directly, but it's available for future features)")
            .addText(text => text
                .setPlaceholder("4096")
                .setValue(this.plugin.settings.maxTokens.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value) || 4096;
                    this.plugin.settings.maxTokens = numValue;
                    updateEstimatedWords(numValue);
                    await this.plugin.saveSettings();
                }));

        // Add estimated words display below the input
        estimatedWordsEl = containerEl.createEl("div", {
            cls: "setting-item-description",
            text: ""
        });
        estimatedWordsEl.style.marginTop = "0.5em";
        estimatedWordsEl.style.marginBottom = "1em";

        // Initialize estimated words display
        updateEstimatedWords(this.plugin.settings.maxTokens);
    }
}

