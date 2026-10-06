# Soumission Firefox Add-ons

## Archive à envoyer

Fichiers générés :

- `web-ext-artifacts/youtube_summarizer_with_gemini-3.8.xpi`
- `web-ext-artifacts/youtube_summarizer_with_gemini-3.8.zip`

AMO (Mozilla Add-ons Developer Hub) accepte indifféremment les archives `.zip` ou `.xpi` pour la mise à jour et la soumission.

Commande de génération :

`npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files README.md TESTING.md AMO_SUBMISSION.md AMO_REVIEW_NOTES.md PRIVACY_POLICY.md docs scripts tests artifacts "docs/**" "tests/**" "scripts/**" "artifacts/**"`
`cp web-ext-artifacts/youtube_summarizer_with_gemini-3.8.zip web-ext-artifacts/youtube_summarizer_with_gemini-3.8.xpi`

Le dossier `docs/` contient le site GitHub Pages et ne doit pas être inclus dans l’archive de l’extension.

## Fichiers utiles

- Politique de confidentialité : `PRIVACY_POLICY.md`
- Notes pour les reviewers : `AMO_REVIEW_NOTES.md`

## Points à renseigner sur AMO

- Nom : `YouTube Summarizer with Gemini` (géré automatiquement en multilingue via `_locales` : `Résumé YouTube avec Gemini` en français)
- Résumé court : extension qui ajoute `Résumer` sur YouTube et envoie l’URL de la vidéo choisie à Gemini avec un texte personnalisable
- Politique de confidentialité : reprendre le contenu de `PRIVACY_POLICY.md`
- Notes de revue : reprendre le contenu de `AMO_REVIEW_NOTES.md`

## État technique

- archive valide selon `web-ext lint`
- aucune erreur
- aucun avertissement
- manifeste compatible avec la déclaration Firefox de transmission de données
- permission `storage` utilisée uniquement pour le texte personnalisé local
