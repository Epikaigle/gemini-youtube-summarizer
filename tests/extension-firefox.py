#!/usr/bin/env python3
"""Exercise the actual extension in disposable Firefox profiles (no Selenium needed).
Run: python3 tests/extension-firefox.py. Requires firefox and geckodriver on PATH.
"""
import base64
import json
import pathlib
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'artifacts' / 'extension'
ADDON_ID = json.loads((ROOT / 'manifest.json').read_text())['browser_specific_settings']['gecko']['id']
WIDGET_ID = ADDON_ID.lower().replace('@', '_').replace('.', '_') + '-browser-action'
BUTTON_ID = ADDON_ID.lower().replace('@', '_').replace('.', '_') + '-BAP'


class Firefox:
    def __init__(self, archive, theme, directory):
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        self.base = f'http://127.0.0.1:{port}'
        self.session = None
        self.log = open(directory / f'geckodriver-{theme}.log', 'w')
        self.process = subprocess.Popen(
            ['geckodriver', '--port', str(port), '--allow-system-access'],
            stdout=self.log, stderr=subprocess.STDOUT)
        try:
            self.wait(lambda: self.request('GET', '/status'))
            result = self.request('POST', '/session', {'capabilities': {'alwaysMatch': {
                'browserName': 'firefox', 'moz:firefoxOptions': {
                    'args': ['-headless'], 'prefs': {
                        'browser.aboutwelcome.enabled': False,
                        'browser.shell.checkDefaultBrowser': False,
                        'ui.prefersReducedMotion': 1,
                        'ui.systemUsesDarkTheme': int(theme == 'dark'),
                        'layout.css.prefers-color-scheme.content-override': 0 if theme == 'dark' else 1
                    }}}}})
            self.session = result['sessionId']
            self.version = result['capabilities']['browserVersion']
            assert self.command('POST', '/moz/addon/install', {'path': str(archive), 'temporary': True}) == ADDON_ID
        except Exception:
            self.close()
            raise

    def request(self, method, path, value=None):
        data = None if value is None else json.dumps(value).encode()
        request = urllib.request.Request(self.base + path, data=data, method=method,
                                         headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                result = json.load(response)['value']
        except urllib.error.HTTPError as error:
            raise RuntimeError(error.read().decode()) from error
        if isinstance(result, dict) and 'error' in result:
            raise RuntimeError(result)
        return result

    def command(self, method, path, value=None):
        return self.request(method, '/session/' + self.session + path, value)

    def js(self, code, *args):
        return self.command('POST', '/execute/sync', {'script': code, 'args': list(args)})

    def async_js(self, code, *args):
        return self.command('POST', '/execute/async', {'script': code, 'args': list(args)})

    def context(self, name):
        self.command('POST', '/moz/context', {'context': name})

    def goto(self, url):
        self.command('POST', '/url', {'url': url})
        self.wait(lambda: self.js('return document.querySelector("#options-form")?.getAttribute("aria-busy") === "false";'))

    def click(self, selector):
        element = self.command('POST', '/element', {'using': 'css selector', 'value': selector})
        self.command('POST', '/element/' + element['element-6066-11e4-a52e-4f735466cecf'] + '/click', {})

    def screenshot(self, name):
        encoded = self.command('GET', '/moz/screenshot/full')
        (ARTIFACTS / name).write_bytes(base64.b64decode(encoded))

    @staticmethod
    def wait(predicate, timeout=15):
        deadline = time.monotonic() + timeout
        last = None
        while time.monotonic() < deadline:
            try:
                result = predicate()
                if result:
                    return result
            except Exception as error:
                last = error
            time.sleep(.1)
        raise AssertionError(f'Timed out waiting for Firefox: {last}')

    def close(self):
        if self.session:
            try:
                self.command('DELETE', '')
            finally:
                self.session = None
        self.process.terminate()
        self.process.wait(timeout=10)
        self.log.close()


def storage(driver, values):
    result = driver.async_js('''
        const done = arguments[arguments.length - 1];
        browser.storage.local.clear().then(() => browser.storage.local.set(arguments[0]))
            .then(() => done(true), error => done({error: error.message}));
    ''', values)
    assert result is True, result


def check_layout(driver, name, expected_min_editor=100):
    metrics = driver.js('''
        const rect = el => el.getBoundingClientRect();
        const editor = document.querySelector('textarea');
        const label = document.querySelector('label[for="prompt-prefix"]');
        const groups = [...document.querySelectorAll('fieldset')];
        return {
            width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
            editorHeight: rect(editor).height, labelHeight: rect(label).height,
            labelPosition: getComputedStyle(label).position,
            overflow: groups.filter(el => el.scrollWidth > el.clientWidth + 2).length,
            missingReferences: [...document.querySelectorAll('[aria-labelledby], [aria-describedby]')]
                .flatMap(el => [el.getAttribute('aria-labelledby'), el.getAttribute('aria-describedby')])
                .filter(Boolean).flatMap(value => value.split(/\\s+/))
                .filter(id => !document.getElementById(id)),
            iconLoaded: document.querySelector('.brand-icon').complete
                && document.querySelector('.brand-icon').naturalWidth > 0
        };
    ''')
    assert metrics['scroll'] <= metrics['width'] + 1, (name, metrics)
    assert metrics['overflow'] == 0, (name, metrics)
    assert metrics['editorHeight'] >= expected_min_editor, (name, metrics)
    assert metrics['labelHeight'] > 15 and metrics['labelPosition'] != 'absolute', (name, metrics)
    assert metrics['missingReferences'] == [], (name, metrics)
    assert metrics['iconLoaded'], (name, metrics)
    return metrics


def check_content_settings(driver):
    # Run the real content script in a local DOM fixture with isolated browser APIs.
    # No request is sent to YouTube or Gemini.
    source = (ROOT / 'content.js').read_text()
    result = driver.async_js('''
        const source = arguments[0], done = arguments[arguments.length - 1];
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const fixtureDocument = frame.contentDocument;
        let listener;
        let saved = {extensionLanguage: 'es'};
        const mockApi = {
            i18n: {getUILanguage: () => 'en-US'},
            storage: {local: {get: async () => saved}, onChanged: {
                addListener: callback => { listener = callback; }
            }}
        };
        const mockWindow = {location: {href: 'https://www.youtube.com/', origin: 'https://www.youtube.com'}};
        const verify = new Function('browser', 'chrome', 'document', 'window', 'getListener', source + `
            return (async () => {
                await loadSettings();
                const output = [buildGeminiPrompt('VIDEO')];
                getListener()({extensionLanguage: {newValue: 'fr'}}, 'local');
                output.push(buildGeminiPrompt('VIDEO'));
                getListener()({geminiPromptPrefix: {newValue: ''}}, 'local');
                getListener()({extensionLanguage: {newValue: 'en'}}, 'local');
                output.push(buildGeminiPrompt('VIDEO'));
                getListener()({extensionLanguage: {newValue: 'es'}, geminiPromptPrefix: {newValue: 'Custom'}}, 'local');
                output.push(buildGeminiPrompt('VIDEO'));
                getListener()({extensionLanguage: {newValue: 'fr'}, geminiPromptPrefix: {newValue: undefined}}, 'local');
                output.push(buildGeminiPrompt('VIDEO'));
                output.push(normalizeVideoUrl('https://www.youtube.com/watch?v=abcdefghijk&list=ignored&t=90'));
                return output;
            })();`);
        verify(mockApi, undefined, fixtureDocument, mockWindow, () => listener).then(
            result => { frame.remove(); done(result); },
            error => { frame.remove(); done({error: error.message}); });
    ''', source)
    assert result == ['Resúmeme el video: VIDEO', 'Résume-moi la vidéo : VIDEO', 'VIDEO',
                      'Custom VIDEO', 'Résume-moi la vidéo : VIDEO',
                      'https://www.youtube.com/watch?v=abcdefghijk'], result


def check_storage_errors(driver):
    result = driver.async_js('''
        const source = arguments[0], html = arguments[1];
        const done = arguments[arguments.length - 1];
        (async () => {
            const outcomes = [];
            for (const failure of ['read', 'write']) {
                const frame = document.createElement('iframe');
                document.body.append(frame);
                const fixture = frame.contentDocument;
                fixture.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
                let writes = 0;
                const api = {i18n: {getUILanguage: () => 'en'}, storage: {local: {
                    get: async () => {
                        if (failure === 'read') throw new Error('Read failed');
                        return {extensionLanguage: 'fr', geminiPromptPrefix: 'Keep my custom prompt'};
                    },
                    set: async () => { writes++; throw new Error('Write failed'); }
                }}};
                const execute = new Function('browser', 'chrome', 'document', 'window', source + `
                    return new Promise(resolve => setTimeout(async () => {
                        await saveOptions({preventDefault() {}});
                        resolve({
                            disabled: document.querySelector('#save-button').disabled,
                            error: document.querySelector('#status').classList.contains('error'),
                            message: document.querySelector('#status').textContent,
                            prefix: document.querySelector('textarea').value
                        });
                    }, 30));`);
                const outcome = await execute(api, undefined, fixture, frame.contentWindow);
                outcomes.push({...outcome, writes});
                frame.remove();
            }
            done(outcomes);
        })().catch(error => done({error: error.message}));
    ''', (ROOT / 'options.js').read_text(), (ROOT / 'options.html').read_text())
    assert result[0]['disabled'] and result[0]['error'] and result[0]['writes'] == 0, result
    assert 'load' in result[0]['message'], result
    assert not result[1]['disabled'] and result[1]['error'] and result[1]['writes'] == 1, result
    assert result[1]['prefix'] == 'Keep my custom prompt', result


def check_preference_accessibility(driver, options_url, theme):
    for zoom in [2, 4]:
        driver.goto(options_url)
        original_width = driver.js('return innerWidth;')
        driver.context('chrome')
        driver.js('gBrowser.selectedBrowser.textZoom = 1; gBrowser.selectedBrowser.fullZoom = arguments[0];', zoom)
        driver.context('content')
        driver.wait(lambda: driver.js('return innerWidth;') <= original_width / zoom + 2)
        check_layout(driver, f'{theme}/page-zoom-{zoom * 100}%', 220)

    driver.goto(options_url)
    driver.context('chrome')
    driver.js('gBrowser.selectedBrowser.fullZoom = 1; gBrowser.selectedBrowser.textZoom = 2;')
    driver.context('content')
    frame = driver.js('''
        const frame = document.createElement('iframe');
        frame.src = arguments[0]; frame.style.cssText = 'width:320px;height:900px;border:0';
        document.body.replaceChildren(frame); return frame;
    ''', options_url)
    driver.command('POST', '/frame', {'id': frame})
    driver.wait(lambda: driver.js('return document.querySelector("#options-form")?.getAttribute("aria-busy") === "false";'))
    # Check that Firefox applied actual text scaling, rather than merely shrinking a viewport.
    assert driver.js('return document.querySelector("textarea").getBoundingClientRect().height >= 400;')
    driver.js('document.querySelector("textarea").value = "X".repeat(1200); document.querySelector("textarea").dispatchEvent(new Event("input"));')
    for lang in ['fr', 'en', 'es']:
        driver.js('document.querySelector("input[value=" + arguments[0] + "]").click();', lang)
        check_layout(driver, f'{theme}/320px/text-200%/{lang}', 220)
    driver.command('POST', '/frame', {'id': None})
    driver.context('chrome')
    driver.js('gBrowser.selectedBrowser.fullZoom = 1; gBrowser.selectedBrowser.textZoom = 1;')
    driver.context('content')
    driver.goto(options_url)

    def key(value):
        driver.command('POST', '/actions', {'actions': [{
            'type': 'key', 'id': 'keyboard', 'actions': [
                {'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value}
            ]
        }]})

    def focused(selector):
        assert driver.js('return document.activeElement.matches(arguments[0]);', selector), selector
        assert driver.js('''
            const control = document.activeElement;
            const indicator = control.tagName === 'INPUT' ? control.nextElementSibling : control;
            return control.matches(':focus-visible') && getComputedStyle(indicator).outlineStyle !== 'none';
        '''), f'{selector}: keyboard focus has no visible indicator'

    key('\ue004')  # Tab to the selected language radio.
    focused('input[name=extension-language]')
    key('\ue014')  # Right arrow changes the selected radio.
    assert driver.js('return document.documentElement.lang;') == 'en'
    key('\ue004')
    focused('#auto-submit')
    before = driver.js('return document.querySelector("#auto-submit").checked;')
    key(' ')
    assert driver.js('return document.querySelector("#auto-submit").checked;') != before
    key('\ue004')
    focused('[data-preset=classic]')
    key('\ue007')  # Enter activates a prompt preset.
    assert driver.js('return document.querySelector("textarea").value;') == 'Summarize this video:'
    for preset in ['points', 'plan', 'simple', 'link']:
        key('\ue004')
        focused(f'[data-preset={preset}]')
    key('\ue004')
    focused('#prompt-prefix')
    key('\ue004')
    focused('#save-button')
    key('\ue007')
    driver.wait(lambda: driver.js('return !document.querySelector("#save-button").disabled;'))
    assert driver.js('return document.activeElement.id;') == 'save-button', 'Save lost keyboard focus'
    key('\ue004')
    focused('#reset-button')


def check_options(driver, options_url, theme):
    driver.context('content')
    driver.goto(options_url)
    check_layout(driver, theme + '/desktop', 220)
    for lang in ['fr', 'en', 'es']:
        driver.js('''
            const radio = document.querySelector('input[value="' + arguments[0] + '"]');
            radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles: true}));
        ''', lang)
        check_layout(driver, theme + '/' + lang, 220)
        assert driver.js('return document.documentElement.lang;') == lang
        expected = {
            'fr': ('Préférences — Résumé YouTube avec Gemini', 'Enregistrer'),
            'en': ('Preferences — YouTube Summarizer with Gemini', 'Save'),
            'es': ('Preferencias — Resumen de YouTube con Gemini', 'Guardar')
        }[lang]
        assert driver.js('return document.title;') == expected[0]
        assert driver.js('return document.querySelector("#save-button").textContent;') == expected[1]
    # Link-only stays empty across language changes, and save commits every setting.
    driver.click('[data-preset="link"]')
    driver.js('document.querySelector("input[value=fr]").click(); document.querySelector("#auto-submit").checked = false;')
    assert driver.js('return document.querySelector("textarea").value;') == ''
    driver.click('#save-button')
    driver.wait(lambda: driver.js('return !document.querySelector("#save-button").disabled;'))
    saved = driver.async_js('const done = arguments[arguments.length-1]; browser.storage.local.get().then(done);')
    assert saved == {'extensionLanguage': 'fr', 'geminiPromptPrefix': '', 'geminiAutoSubmit': False}, saved
    driver.goto(options_url)
    assert driver.js('return document.querySelector("textarea").value;') == ''
    assert driver.js('return document.querySelector("#auto-submit").checked;') is False
    driver.click('#reset-button')
    driver.wait(lambda: driver.js('return !document.querySelector("#save-button").disabled;'))
    assert driver.async_js('const done=arguments[arguments.length-1]; browser.storage.local.get().then(done);') == {}
    # A long prompt and URL stay readable in the full page, including narrow screens.
    storage(driver, {'extensionLanguage': 'fr', 'geminiPromptPrefix': 'Explique les idées principales de cette vidéo. ' * 20})
    driver.goto(options_url)
    assert driver.js('return document.querySelector("input[name=extension-language]:checked")?.value;') == 'fr'
    assert driver.js('return getComputedStyle(document.querySelector("input:checked + span")).backgroundColor !== getComputedStyle(document.body).backgroundColor;')
    assert driver.js('return document.querySelector("pre").scrollHeight <= document.querySelector("pre").clientHeight + 1;')
    driver.screenshot(f'options-desktop-{theme}.png')
    check_content_settings(driver)
    check_storage_errors(driver)
    check_preference_accessibility(driver, options_url, theme)
    for width in [320, 390, 768]:
        element = driver.js('''
            const frame = document.createElement('iframe');
            frame.src = arguments[0]; frame.style.cssText = `width:${arguments[1]}px;height:1600px;border:0`;
            document.body.replaceChildren(frame); return frame;
        ''', options_url, width)
        driver.command('POST', '/frame', {'id': element})
        driver.wait(lambda: driver.js('return document.querySelector("#options-form")?.getAttribute("aria-busy") === "false";'))
        check_layout(driver, f'{theme}/{width}px', 220)
        for lang in ['en', 'es']:
            driver.js('document.querySelector("input[value=" + arguments[0] + "]").click();', lang)
            check_layout(driver, f'{theme}/{width}px/{lang}', 220)
        driver.command('POST', '/frame', {'id': None})
        driver.goto(options_url)
    popup_url = options_url.replace('options.html', 'popup.html')
    element = driver.js('''
        const frame = document.createElement('iframe');
        frame.src = arguments[0]; frame.style.cssText = 'width:420px;height:600px;border:0';
        document.body.replaceChildren(frame); return frame;
    ''', popup_url)
    driver.command('POST', '/frame', {'id': element})
    driver.wait(lambda: driver.js('return document.querySelector("#options-form")?.getAttribute("aria-busy") === "false";'))
    check_layout(driver, theme + '/popup-420x600')
    assert driver.js('return document.querySelector(".actions").getBoundingClientRect().bottom <= 600;')
    driver.js('document.body.scrollTop = document.body.scrollHeight;')
    assert driver.js('return document.querySelector(".actions").getBoundingClientRect().bottom <= 600;')
    driver.command('POST', '/frame', {'id': None})
    driver.goto(popup_url)
    check_layout(driver, theme + '/popup-tab')
    driver.screenshot(f'popup-content-{theme}.png')
    # The real extension API opens its declared options page, without the tabs permission.
    driver.js('window.close = () => {};')  # Keep this test tab available for assertions.
    original_handle = driver.command('GET', '/window')
    driver.click('#open-full-tab')
    new_handles = driver.wait(lambda: [handle for handle in driver.command('GET', '/window/handles')
                                      if handle != original_handle])
    driver.command('POST', '/window', {'handle': new_handles[0]})
    driver.wait(lambda: driver.command('GET', '/url') == options_url)


def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='yt-extension-tests-') as directory:
        directory = pathlib.Path(directory)
        archive = directory / 'extension.xpi'
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
            for name in ['manifest.json', 'content.js', 'gemini_auto_submit.js',
                         'popup.html', 'options.html', 'options.css', 'options.js']:
                package.write(ROOT / name, name)
            for folder in ['icons', '_locales']:
                for file in (ROOT / folder).rglob('*'):
                    if file.is_file():
                        package.write(file, str(file.relative_to(ROOT)))
        results = []
        for theme in ['light', 'dark']:
            driver = Firefox(archive, theme, directory)
            try:
                driver.context('chrome')
                driver.js('CustomizableUI.addWidgetToArea(arguments[0], "nav-bar");', WIDGET_ID)
                driver.wait(lambda: driver.js('return !!document.getElementById(arguments[0]);', BUTTON_ID))
                # No options tab or popup resource has been loaded before this first click.
                driver.click('#' + BUTTON_ID)
                metrics = driver.wait(lambda: driver.js('''
                    const popup = document.querySelector('browser[webextension-view-type="popup"]');
                    if (!popup || popup.getBoundingClientRect().height < 100) return null;
                    const rect = popup.getBoundingClientRect();
                    return {width: rect.width, height: rect.height};
                '''))
                assert metrics['width'] == 420 and 100 < metrics['height'] <= 600, metrics
                driver.js('document.getElementById("customizationui-widget-panel").hidePopup();')
                options_url = driver.js('return WebExtensionPolicy.getByID(arguments[0]).getURL("options.html");', ADDON_ID)
                check_options(driver, options_url, theme)
                results.append({'firefox': driver.version, 'theme': theme, 'firstPopup': metrics})
                print(f'PASS Firefox {driver.version}/{theme}: cold toolbar click, preferences, storage, languages, 320/390/768px, page zoom 200/400%, text 200%, keyboard, content settings', flush=True)
            finally:
                driver.close()
        (ARTIFACTS / 'test-results.json').write_text(json.dumps(results, indent=2) + '\n')


if __name__ == '__main__':
    main()
