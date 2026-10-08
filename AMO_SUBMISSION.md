# Mise à jour Firefox Add-ons — 3.8.1

## Archive à envoyer

- `web-ext-artifacts/youtube_summarizer_with_gemini-3.8.1.zip`
- Copie au format XPI : `web-ext-artifacts/youtube_summarizer_with_gemini-3.8.1.xpi`

Ces deux fichiers contiennent la même extension. AMO accepte ZIP et XPI. Ils ne sont pas encore signés ; Mozilla assure la signature après la soumission.

```sh
npx --yes web-ext lint --source-dir . --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
cp web-ext-artifacts/youtube_summarizer_with_gemini-3.8.1.zip web-ext-artifacts/youtube_summarizer_with_gemini-3.8.1.xpi
```

La documentation, le site, les tests et les outils de développement sont exclus du paquet. Le workflow GitHub **Extension checks** génère aussi un ZIP non signé téléchargeable dans l’artifact `unsigned-firefox-extension`.

## Mise à jour de la fiche existante

1. Ouvrir le [Developer Hub AMO](https://addons.mozilla.org/developers/) et sélectionner l’extension existante `gemini-youtube-summarizer`.
2. Ajouter une nouvelle version et envoyer l’archive **3.8.1**. Conserver l’identifiant de l’extension ; ne pas créer une nouvelle fiche.
3. Renseigner les notes de version et les notes de revue.
4. Vérifier les traductions de la fiche dans l’éditeur AMO : nom, résumé, description et confidentialité pour **français, anglais et espagnol**.

Le dossier `_locales/` traduit l’extension installée. Il ne met pas à jour automatiquement les textes de sa fiche publique AMO. Lors de la vérification du 8 octobre 2026, la fiche publiée était en version 3.8, avec un nom et un résumé français dans sa variante anglaise et aucune description espagnole.

## Textes prêts à utiliser

- [AMO_LISTING.md](AMO_LISTING.md) : noms, résumés, descriptions et notes de version FR/EN/ES.
- Politique de confidentialité : [français](PRIVACY_POLICY.md), [anglais](PRIVACY_POLICY.en.md), [espagnol](PRIVACY_POLICY.es.md).
- [AMO_REVIEW_NOTES.md](AMO_REVIEW_NOTES.md) : fonctionnement et transmission à Gemini expliqués au reviewer.

## Vérifications techniques

- Manifest V3, version **3.8.1**, identifiant Gecko inchangé.
- Permission `storage` pour la consigne, la langue et le choix d’envoi automatique, conservés localement.
- Déclaration `browsingActivity` correspondant à l’URL de la vidéo envoyée à Gemini après le clic demandé par l’utilisateur.
- Aucun code distant, minification ou dépendance au runtime.
- Tests Firefox : première ouverture de la popup, sauvegarde, erreurs de stockage, trois langues, mise en page étroite, zoom et clavier.

Le contrôle local ne remplace pas la validation et la signature par Mozilla. Le flux YouTube → Gemini avec un compte Google doit être vérifié dans votre Firefox habituel avant publication ; la session automatisée n’a pas validé l’envoi connecté ni Firefox Android sur appareil réel.

Référence : [guide officiel Mozilla de soumission et de mise à jour](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).
