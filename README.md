# WhatsApp Desktop for Linux

A simple, lightweight, and unofficial WhatsApp desktop wrapper for Linux built with [Electron](https://www.electronjs.org/).

## Features

- **Cross-Distribution Support**: Packaged for almost all major Linux distributions (`.AppImage`, `.deb`, `.rpm`, `.snap`, `.pacman`, `.tar.gz`).
- **Context Menu**: Full support for right-click copy, paste, and save image functionality.
- **Window State Keeper**: Remembers your window size and position between sessions.
- **Bypass Blocks**: Utilizes a custom User-Agent to bypass WhatsApp Web's browser restrictions.

## Development

To run this application locally, you will need [Node.js](https://nodejs.org/) installed on your machine.

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/whatsapp-desktop.git
   cd whatsapp-desktop
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
