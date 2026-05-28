# OpenWhats

[![Get it from the Snap Store](https://snapcraft.io/en/dark/install.svg)](https://snapcraft.io/openwhats)
[![Get it from the Snap Store](https://snapcraft.io/en/light/install.svg)](https://snapcraft.io/openwhats)
[![openwhats](https://snapcraft.io/openwhats/badge.svg)](https://snapcraft.io/openwhats)

A simple, lightweight, and unofficial WhatsApp desktop wrapper for Linux built with [Electron](https://www.electronjs.org/).

## Features

- **Linux Packages**: Builds AppImage, Debian package, and Snap artifacts through electron-builder.
- **Context Menu**: Full support for right-click copy, paste, and save image functionality.
- **Window State Keeper**: Remembers your window size and position between sessions.
- **Bypass Blocks**: Utilizes a custom User-Agent to bypass WhatsApp Web's browser restrictions.
- **Privacy Blur**: Blurs WhatsApp Web when the app window loses focus.
- **Tray Menu**: Provides quick access to show OpenWhats or quit the app.
- **Auto Updates**: Checks for published updates with `electron-updater`.

## Installation

Go to the [Releases](https://github.com/kevelino/openwhats/releases) page and download the appropriate package for your Linux distribution.

### Debian / Ubuntu / Linux Mint (.deb)
```bash
sudo dpkg -i openwhats_2.0.0_amd64.deb
sudo apt-get install -f # To resolve any missing dependencies
```

### Snap Package (.snap)
```bash
sudo snap install openwhats_2.0.0_amd64.snap --dangerous
```

### Universal AppImage (.AppImage)
```bash
chmod +x OpenWhats-2.0.0.AppImage
./OpenWhats-2.0.0.AppImage
```

## Development

To run this application locally, you will need [Node.js](https://nodejs.org/) installed on your machine.

1. Clone the repository:
   ```bash
   git clone https://github.com/kevelino/openwhats.git
   cd openwhats
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Building

To build the application for your local machine, run:

```bash
npm run build
```

This will create the executables in the `dist` directory.

## Publishing a Release

To publish a release to GitHub, ensure you have exported your GitHub Personal Access Token:

```bash
export GH_TOKEN="your_personal_access_token"
npm run release
```

## License

This project is licensed under the [MIT License](LICENSE).
