# SekaiPlus for Vencord

A fork of [sekaistickers-vencord](https://codeberg.org/maikokain/sekaistickers-vencord/) by maikokain with significant improvements and new features.

## Features

### ✅ Completed Improvements
- [x] **Repository Support** - Add custom sticker repositories
- [x] **Enhanced Character Picker** - Responsive grid layout that scales with window size

### 🚧 Planned Improvements
- [ ] **GIF Support** - Animated sticker support
- [ ] **Text Colour Picker** - Custom text colors beyond character defaults
- [ ] **Text Default Settings** - Save and restore custom text positioning presets
- [ ] **Saved Stickers** - Save sticker configurations for quick access

## Installation

1. Place this plugin in your Vencord userplugins directory
2. Enable the plugin in Vencord settings
3. Configure repositories in plugin settings (SekaiPlus repository is included by default)

## Usage

1. Click the Kanade icon in the chat input bar
2. Select a character from the picker
3. Customize text, positioning, and effects
4. Upload as attachment to Discord

## Known Repositories

| Repository Name | Sticker Count | Description | Meta URL |
|----------------|---------------|-------------|----------|
| **Project Sekai Stickers** | 360+ | Stickers from https://st.ayaka.one/ | `https://raw.githubusercontent.com/ItsLogic/SekaiPlus/refs/heads/sekai/meta.json` |
| **Genshin Impact Stickers** | 2 | Genshin Impact in game chat stickers | `https://raw.githubusercontent.com/ItsLogic/SekaiPlus/refs/heads/genshin/meta.json` |

> **Note**: Sticker counts are approximate and may change as repositories are updated.

## Adding Custom Repositories

1. Open Vencord Settings → Plugins → Sekai Stickers
2. Add the direct URL to a repository's `meta.json` file
3. The repository name will be automatically fetched
4. Click "Reload All Repositories" to refresh

### Repository Format
Repositories must contain:
- `meta.json` - Repository metadata
- `characters.json` - Array of character definitions
- `stickers/` - Directory containing sticker images

Use the [Genshin Impact Stickers](https://github.com/ItsLogic/SekaiPlus/tree/genshin) repository as a template for your own.

## Credits

- **Original Plugin**: [maikokain](https://codeberg.org/maikokain/sekaistickers-vencord/)
- **Fork Improvements**: [ItsLogic](https://github.com/ItsLogic) & draff
- **Font Assets**: YurukaStd, SSFangTangTi