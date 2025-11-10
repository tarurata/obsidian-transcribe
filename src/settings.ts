import { App, PluginSettingTab, Setting } from "obsidian";
import TranscribePlugin from "./main";

export interface TranscribeSettings {
    openaiApiKey: string;
}

export const DEFAULT_SETTINGS: TranscribeSettings = {
    openaiApiKey: ""
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
    }
}

