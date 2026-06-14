# Twitch Chat Translator

English | [日本語](README.md) | [Русский](README.ru.md)

A web app that translates and displays Twitch chat in real time.

**[▶ Use it now](https://kawachan-jp.github.io/twitch-chat-translate/)**

---

## Features

- **No API key required** - Uses an unofficial Google Translate API, so you can start without signing up
- **No server required** - Runs entirely in the browser and works on GitHub Pages
- **Anonymous connection** - Reads Twitch chat without a Twitch account
- **Automatic language detection** - Detects the source language automatically
- **Multilingual support** - Supports 15+ languages
- **Emote detection** - Automatically collapses repeated emote spam
- **Font and size controls** - Adjust the chat display for readability
- **OBS overlay** - Display decorated chat as an OBS browser source
- **Appearance controls** - Adjust presets, colors, spacing, lifetime, and effects
- **Custom CSS** - Fine-tune the chat display with your own CSS
- **Chat sending (experimental)** - Log in with Twitch and send translated chat messages

---

## How to Use

### 1. Connect to a channel

![Setup screen](docs/images/screenshot-setup.png)

1. [Open the page](https://kawachan-jp.github.io/twitch-chat-translate/)
2. Enter a channel name, for example `xqc`
3. Select the **source language**. If you are not sure, leave it as "Auto Detect"
4. Select the **target language**. The default is Japanese
5. Click **Connect**

### 2. Use the chat screen

![Chat screen](docs/images/screenshot-chat.png)

After connecting, you can change settings from the header.

| Item | Description |
|------|-------------|
| `Auto → Japanese` | Switch the source and target languages in real time |
| `S / M / L / XL` | Change the chat font size |
| `⚙` | Open the advanced settings panel |
| `Disconnect` | Disconnect from the channel and return to the top screen |

### 3. Settings panel

Click the **⚙ icon** in the header to open the settings panel.

| Setting | Description |
|---------|-------------|
| Auto scroll | Automatically scroll down when new messages arrive |
| Hide bots & commands | Exclude bot messages and commands from the chat display |
| Send [experimental] | Show the chat sending panel. Twitch login is required |
| Font | Switch between sans-serif, serif, and monospace fonts |
| UI language | Change the interface language |
| Appearance | Change chat presets, colors, spacing, and effects |
| Manage blocked users | Add or remove users that should not be displayed |
| Copy OBS URL | Copy an OBS browser source URL containing the current appearance settings |

---

## Appearance

Click **Appearance** in the settings panel to customize the chat display.

| Item | Description |
|------|-------------|
| Preset | Plain / Box / Separator / Bubble / Glass / Neon / Compact / Terminal / Minimal / Card / Broadcast / Pastel |
| Show elements | Show or hide the name, time, original text, and translation |
| Effect | Choose the animation used when a new message appears |
| Background color | Set a shared message background color for every preset |
| Text colors | Change translation, original text, and name colors separately |
| Restore preset colors | Restore the selected preset's default colors |
| Message spacing | Adjust the space between messages |
| Disappear after time | Remove messages after a chosen delay using Fade / Slide / Shrink / Blur |
| Chroma key color | Set the background color removed by OBS chroma key |
| Custom CSS | Directly edit CSS for detailed customization |

Settings are saved automatically in the browser. Custom CSS is also saved and applied as you type, so no save button is required.

### Display in OBS

1. Configure the chat display in **Appearance**
2. Click **Copy OBS URL** in the settings panel
3. Add a Browser Source in OBS and paste the copied URL
4. Configure chroma key in OBS if needed

The copied OBS URL includes appearance settings, shown elements, colors, spacing, message lifetime, and custom CSS.

---

## Chat Sending (Experimental)

![Send bar](docs/images/screenshot-send.png)

After logging in with your Twitch account, you can translate and send chat messages.

1. Turn on **Send [experimental]** in the settings panel
2. Click **Log in with Twitch** and authorize the app
3. Enter a message, then press `Enter` or click **Send**
4. The input text is automatically translated into the **chat language** and sent

> **Note:** If the source language is set to "Auto Detect", the message will be sent without translation. To translate before sending, manually choose the source language.

---

## Using It on Your Own Server

You can also download this repository and publish it on your own server or custom domain.

If you only want to **read and translate chat**, you can usually just upload all files to a web server. No API key or Twitch account integration setup is required.

However, if you want to **log in with Twitch and send chat messages**, you need to register your own app in the Twitch Developer Console.

1. Open the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account
3. Register an application
4. Add your public site URL as the `OAuth Redirect URL`
   - Example: `https://example.com/`
   - For local testing: `http://localhost:8000/`
5. Set the issued `Client ID` and redirect URL in `js/config.js`

```js
export const TWITCH_CLIENT_ID = 'your Client ID';
export const TWITCH_REDIRECT_URI = 'https://example.com/';
```

In short, reading and translating chat only requires hosting the files. Twitch Developer Console setup is only needed if you want to use chat sending.

---

## Stamp / Emote Detection

Messages where the same word appears three or more times in a row are treated as emote spam and collapsed without translation.

```text
🎴 Stamp  karubisUnun  ×4
```

---

## Supported Languages

| Source | Target |
|--------|--------|
| Auto Detect / English / Korean / Chinese (Simplified and Traditional)<br>Spanish / French / German / Portuguese<br>Russian / Japanese / Arabic / Hindi<br>Thai / Vietnamese / Indonesian | English / Korean / Chinese (Simplified and Traditional)<br>Spanish / French / German / Portuguese<br>Russian / **Japanese (default)** / Arabic<br>Hindi / Thai / Vietnamese / Indonesian |

---

## Requirements

- Works in major browsers on desktop and mobile
- Google Chrome / Microsoft Edge recommended

---

## Tech Stack

- Twitch IRC over WebSocket (anonymous connection / OAuth authentication)
- Unofficial Google Translate API (automatic language detection with `sl=auto`)
- Twitch Helix API (fetches the logged-in username)
- Plain HTML + CSS + JavaScript (no framework)

---

## Notes

- The unofficial Google Translate API may change or stop working without notice
- Translation may fall behind on channels with very active chat
- The developer is not responsible for any damages caused by using this tool

---

## Related

- [speech-to-text](https://github.com/KAWAchan-jp/speech-to-text) - A real-time speech recognition subtitle tool by the same author
- [Twitch IRC Documentation](https://dev.twitch.tv/docs/irc/)
