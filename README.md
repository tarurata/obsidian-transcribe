# Obsidian Transcribe Plugin

A plugin for Obsidian that allows you to record your voice and automatically transcribe it using OpenAI's Whisper API. The transcribed text is inserted at your current cursor position.

## Features

- 🎤 **Floating Record Button**: Easy access to start recording from anywhere
- ⏸️ **Pause/Resume**: Control your recording with pause and resume functionality
- ⏱️ **Recording Timer**: See how long you've been recording
- 🔑 **API Key Configuration**: Secure settings page for your OpenAI API key
- 📝 **Auto-Insert**: Transcribed text is automatically inserted at your cursor position
- 📱 **Cross-Platform**: Works on both Mac and iPhone (mobile Obsidian)

## Installation

1. Copy this folder to your Obsidian vault's `.obsidian/plugins/` directory
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Enable the plugin in Obsidian's settings

## Configuration

1. Go to Settings → Transcribe
2. Enter your OpenAI API key (get one from https://platform.openai.com/api-keys)
3. Save the settings

## Usage

1. Click the floating microphone button (bottom-right corner) or use the command "Start Transcribe"
2. Grant microphone permissions when prompted
3. Start speaking - the recording will begin automatically
4. Use the Pause button to pause/resume recording
5. Click Stop when finished
6. The audio will be sent to OpenAI Whisper API for transcription
7. The transcribed text will be inserted at your current cursor position

## Development

- `npm run dev` - Start development build with watch mode
- `npm run build` - Build for production
- `npm run sync` - Build and sync to your Obsidian vault (requires `sync.sh`)

### Setting up sync script (optional)

For easier development, you can set up automatic syncing to your vault:

1. Copy `sync.sh.example` to `sync.sh`
2. Edit `sync.sh` and update the `VAULT_PLUGIN_DIR` path to your Obsidian vault
3. Run `npm run sync` to build and sync automatically

## Requirements

- Obsidian v0.15.0 or higher
- OpenAI API key with access to Whisper API
- Microphone permissions

## License

MIT

