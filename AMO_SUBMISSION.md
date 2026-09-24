# Soumission Firefox Add-ons

## Archive à envoyer

Fichier généré :

`web-ext-artifacts/r_sum_youtube_par_gemini-3.7.zip`

AMO accepte les archives `.zip` pour la soumission.

Commande de génération :

`npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files README.md TESTING.md AMO_SUBMISSION.md AMO_REVIEW_NOTES.md PRIVACY_POLICY.md "docs/**"`

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
