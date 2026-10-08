# YouTube Summarizer with Gemini

[English](README.md) · [Français](README.fr.md) · [Español](README.es.md)

A lightweight Firefox extension that adds a **Summarize** action to YouTube.

## Official links

- [Website](https://epikaigle.github.io/gemini-youtube-summarizer/)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/gemini-youtube-summarizer/)
- [Source code](https://github.com/Epikaigle/gemini-youtube-summarizer)

## How it works

Summarize appears in the three-dot menus on video cards and beside the actions on watch pages. Clicking it opens Gemini with the normalized video URL and your own instructions. The extension fills Gemini’s input and submits the message, or leaves it ready to send if automatic submission is disabled.

From the Firefox toolbar icon or preferences in `about:addons`, you can:

- Choose French, English, Spanish, or automatic browser-language detection.
- Enable or disable automatic submission. Disabling it lets you choose your Gemini model or edit the message before sending.
- Write custom instructions or use a template: classic summary, five key takeaways, detailed outline, simple explanation, or link only.

The popup’s top-right button opens a larger preferences page with a bigger text area and the full message preview. Click **Save** to apply all settings together. An empty field keeps link-only mode, including after a language change.

## Load locally in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `manifest.json`.
4. Reload YouTube with `Ctrl+Shift+R`.

## Structure and website

- `manifest.json`: extension configuration (Manifest V3).
- `popup.html`: quick preferences from the Firefox toolbar.
- `content.js`: YouTube menus, URL extraction, watch-page button, and localized actions.
- `gemini_auto_submit.js`: prompt insertion and automatic or manual submission in Gemini.
- `options.html`, `options.css`, `options.js`: full preferences interface.
- `_locales/`: extension translation catalogs (`fr`, `en`, `es`).
- `icons/`: extension icons.
- `docs/`: responsive GitHub Pages website with a visual demo, prompt preview, installation links, and privacy policy.

GitHub Pages serves `docs/` from `main`. The extension and user documentation support French, English, and Spanish; the website also offers Chinese. Technical guides remain in French. AMO listing translations are entered separately; uploading the extension archive does not update them.

## Checks and Firefox Add-ons submission

Run `python3 tests/extension-firefox.py` with Firefox and geckodriver installed. Version 3.8.1 fixes and verification limits are documented in [EXTENSION_AUDIT.md](EXTENSION_AUDIT.md) (French).

Build a clean archive:

```sh
npx --yes web-ext lint --source-dir . --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
```

Upload the version 3.8.1 archive as a new version of the existing add-on in AMO. See the [privacy policy](PRIVACY_POLICY.en.md), [localized listing and release notes](AMO_LISTING.md), and [reviewer notes](AMO_REVIEW_NOTES.md) (French).

Mozilla’s signature is required for a persistent installation. `META-INF/` is generated when signing; website files must stay outside the extension archive. Google sign-in may be blocked in automated browsers, so test the real Gemini workflow in normal Firefox.

GitHub checks validate the website, translations, and extension package. The **Extension checks** workflow also provides an unsigned archive in its `unsigned-firefox-extension` artifact.

## YouTube pages covered

Home, Subscriptions, watch pages (including playlists), channel pages, Videos tabs, and Streams tabs. YouTube and Gemini interface changes may require adjustments to the extension.

## License

This project uses **The Unlicense**. See `LICENSE`.
