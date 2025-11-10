import { Plugin, MarkdownView } from 'obsidian';
import { TranscribeSettingTab, TranscribeSettings, DEFAULT_SETTINGS } from './settings';
import { RecordingModal } from './RecordingModal';

export default class TranscribePlugin extends Plugin {
    settings: TranscribeSettings;
    private floatingButton: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new TranscribeSettingTab(this.app, this));

        // Create floating button
        this.createFloatingButton();

        // Add command
        this.addCommand({
            id: 'start-transcribe',
            name: 'Start Transcribe',
            callback: () => {
                this.startRecording();
            }
        });
    }

    onunload() {
        if (this.floatingButton) {
            this.floatingButton.remove();
        }
    }

    createFloatingButton() {
        this.floatingButton = document.body.createDiv({
            cls: 'transcribe-floating-button',
            attr: {
                'aria-label': 'Start Recording'
            }
        });

        // Add microphone icon (using SVG)
        this.floatingButton.innerHTML = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
				<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
				<line x1="12" y1="19" x2="12" y2="23"></line>
				<line x1="8" y1="23" x2="16" y2="23"></line>
			</svg>
		`;

        this.floatingButton.addEventListener('click', () => {
            this.startRecording();
        });
    }

    startRecording() {
        if (!this.settings.openaiApiKey) {
            // Show error notification
            const notification = document.createElement('div');
            notification.className = 'transcribe-error-notification';
            notification.textContent = 'Please configure your OpenAI API key in settings';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
            return;
        }

        const modal = new RecordingModal(this.app, async (audioBlob: Blob) => {
            await this.transcribeAndInsert(audioBlob);
        });
        modal.open();
    }

    async transcribeAndInsert(audioBlob: Blob) {
        try {
            // Show loading notification
            const loadingNotification = document.createElement('div');
            loadingNotification.className = 'transcribe-loading-notification';
            loadingNotification.textContent = 'Transcribing...';
            document.body.appendChild(loadingNotification);

            // Determine file extension based on blob type
            let extension = 'webm';
            let mimeType = audioBlob.type || 'audio/webm';
            if (mimeType.includes('mp4')) {
                extension = 'mp4';
            } else if (mimeType.includes('ogg')) {
                extension = 'ogg';
            }

            // Convert audio blob to File for FormData
            const audioFile = new File([audioBlob], `recording.${extension}`, { type: mimeType });

            // Create FormData
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', this.settings.model);

            // Add language if not auto-detect
            if (this.settings.language && this.settings.language !== 'auto') {
                formData.append('language', this.settings.language);
            }

            // Call OpenAI Whisper API
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiApiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Transcription failed');
            }

            const result = await response.json();
            const transcribedText = result.text;

            // Remove loading notification
            loadingNotification.remove();

            // Insert text at current cursor position
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                const cursor = editor.getCursor();
                editor.replaceRange(transcribedText, cursor);
                // Move cursor to end of inserted text
                editor.setCursor({
                    line: cursor.line,
                    ch: cursor.ch + transcribedText.length
                });

                // Show success notification
                const successNotification = document.createElement('div');
                successNotification.className = 'transcribe-success-notification';
                successNotification.textContent = 'Transcription completed';
                document.body.appendChild(successNotification);
                setTimeout(() => successNotification.remove(), 2000);
            } else {
                // No active editor - copy to clipboard as fallback
                await navigator.clipboard.writeText(transcribedText);
                const fallbackNotification = document.createElement('div');
                fallbackNotification.className = 'transcribe-success-notification';
                fallbackNotification.textContent = 'Transcription copied to clipboard (no active editor)';
                document.body.appendChild(fallbackNotification);
                setTimeout(() => fallbackNotification.remove(), 3000);
            }

        } catch (error) {
            console.error('Transcription error:', error);
            // Remove loading notification if still present
            const loadingEl = document.querySelector('.transcribe-loading-notification');
            if (loadingEl) {
                loadingEl.remove();
            }
            // Show error notification
            const errorNotification = document.createElement('div');
            errorNotification.className = 'transcribe-error-notification';
            errorNotification.textContent = `Error: ${error instanceof Error ? error.message : 'Transcription failed'}`;
            document.body.appendChild(errorNotification);
            setTimeout(() => errorNotification.remove(), 5000);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

