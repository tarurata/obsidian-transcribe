import { Modal, ButtonComponent, App } from "obsidian";

export class RecordingModal extends Modal {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private isRecording: boolean = false;
    private isPaused: boolean = false;
    private startTime: number = 0;
    private pausedTime: number = 0;
    private totalPausedDuration: number = 0;
    private timerInterval: NodeJS.Timeout | null = null;
    private onStopCallback: (audioBlob: Blob) => Promise<void>;
    private timerEl: HTMLElement;
    private pauseButton: ButtonComponent;
    private stopButton: ButtonComponent;

    constructor(app: App, onStop: (audioBlob: Blob) => Promise<void>) {
        super(app);
        this.onStopCallback = onStop;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("transcribe-modal");

        // Timer display
        this.timerEl = contentEl.createEl("div", {
            cls: "transcribe-timer",
            text: "00:00"
        });

        // Buttons container
        const buttonsContainer = contentEl.createEl("div", {
            cls: "transcribe-buttons"
        });

        // Pause/Resume button
        this.pauseButton = new ButtonComponent(buttonsContainer)
            .setButtonText("Pause")
            .setCta()
            .onClick(() => this.togglePause());

        // Stop button
        this.stopButton = new ButtonComponent(buttonsContainer)
            .setButtonText("Stop")
            .setClass("mod-warning")
            .onClick(() => this.stopRecording());

        this.startRecording();
    }

    onClose() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.mediaRecorder) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Determine best mime type for the platform
            let mimeType = 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            }

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            this.audioChunks = [];
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.totalPausedDuration = 0;
            this.pausedTime = 0;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.onStopCallback(audioBlob);
            };

            this.mediaRecorder.start();
            this.startTimer();
        } catch (error) {
            console.error("Error starting recording:", error);
            this.close();
            // Show error notification
            // You might want to add a notification here
        }
    }

    togglePause() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            return;
        }

        if (this.isPaused) {
            // Resume
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.totalPausedDuration += Date.now() - this.pausedTime;
            this.pauseButton.setButtonText("Pause");
            this.startTimer();
        } else {
            // Pause
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pausedTime = Date.now();
            this.pauseButton.setButtonText("Resume");
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.isRecording = false;
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.close();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = Date.now() - this.startTime - this.totalPausedDuration;
                const seconds = Math.floor(elapsed / 1000);
                const minutes = Math.floor(seconds / 60);
                const displaySeconds = seconds % 60;
                this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            }
        }, 100);
    }
}

