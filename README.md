# Resume YouTube par Gemini

Extension Firefox minimaliste qui ajoute une action `Résumer` sur YouTube.

## Liens officiels

- Site : `https://epikaigle.github.io/resume-youtube-gemini/`
- Firefox Add-ons : `https://addons.mozilla.org/fr/firefox/addon/gemini-youtube-summarizer/`
- Code source : `https://github.com/Epikaigle/resume-youtube-gemini`

Le flux est le suivant :
- sur YouTube, `Résumer` apparaît dans les menus `3 points`
- sur une page `watch`, un bouton `Résumer` apparaît aussi à côté des actions vidéo
- le texte place avant le lien YouTube peut etre personnalise dans les options de l'extension
- au clic, l'extension ouvre Gemini avec un prompt contenant ce texte et l'URL normalisée de la vidéo
- sur Gemini, le prompt est injecté et l'envoi est tenté automatiquement

## Site web

Le site de présentation de l'extension est versionné dans le même dépôt, dans le dossier `docs/`.

Une fois GitHub Pages configuré sur la branche `main` avec le dossier `/docs`, le site est disponible à l'adresse :

`https://epikaigle.github.io/resume-youtube-gemini/`

Le site contient :
- une landing page courte et responsive
- une démonstration visuelle du flux YouTube → Résumer → Gemini
- un bouton d'installation vers la fiche officielle Firefox Add-ons
- une présentation du prompt personnalisable et de la confidentialité
- une page de politique de confidentialité
- des liens vers le code source et Firefox Add-ons

## Structure

- `manifest.json` : configuration de l'extension
- `content.js` : logique YouTube, détection des menus, extraction des URLs, bouton `watch`
- `gemini_auto_submit.js` : logique Gemini, remplissage et soumission du prompt
- `options.html`, `options.css`, `options.js` : page d'options pour personnaliser le texte avant le lien
- `icons/` : icônes de l'extension
- `docs/` : site GitHub Pages de présentation de l'extension

## Installation locale dans Firefox

1. Ouvrir `about:debugging#/runtime/this-firefox`
2. Cliquer sur `Charger un module complémentaire temporaire`
3. Sélectionner `manifest.json`
4. Recharger YouTube avec `Ctrl+Shift+R`

## Options

La page d'options permet de personnaliser le texte ajoute avant l'URL YouTube. Le champ peut rester vide pour envoyer uniquement le lien.

Valeur par defaut :

`Résume-moi la vidéo :`

Exemple de prompt envoye a Gemini :

`Résume-moi la vidéo : https://www.youtube.com/watch?v=VIDEO_ID`

## Soumission AMO

Fichiers utiles pour la soumission Firefox Add-ons :
- `manifest.json`
- `PRIVACY_POLICY.md`
- `AMO_REVIEW_NOTES.md`

Archive de soumission :
- generer une archive propre avec `npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files README.md TESTING.md AMO_SUBMISSION.md AMO_REVIEW_NOTES.md PRIVACY_POLICY.md "docs/**"`
- envoyer ensuite l'archive sur le portail developpeur AMO

## Notes

- Les fichiers `META-INF/` ne font pas partie du source. Ils sont générés lors du packaging/signature.
- Le dossier `docs/` contient uniquement le site de présentation et doit être exclu du package de l'extension.
- Pour une installation persistante, il faut reconstruire une archive `.xpi` propre puis la signer.
- La connexion Google peut être bloquée dans un navigateur automatisé. Le test réel doit se faire dans Firefox normal.

## Compatibilité testée

- accueil YouTube
- page Abonnements
- page `watch`
- page `watch` avec playlist
- page de chaîne
- onglet `videos`
- onglet `streams`

Le comportement dépend du DOM de YouTube et de Gemini, donc des ajustements peuvent être nécessaires si leur interface change.
