# YouTube Summarizer with Gemini (Résumé YouTube avec Gemini)

Extension Firefox minimaliste qui ajoute une action `Résumer` sur YouTube.

## Liens officiels

- Site : `https://epikaigle.github.io/gemini-youtube-summarizer/`
- Firefox Add-ons : `https://addons.mozilla.org/firefox/addon/gemini-youtube-summarizer/`
- Code source : `https://github.com/Epikaigle/gemini-youtube-summarizer`

Le flux est le suivant :
- sur YouTube, `Résumer` apparaît dans les menus `3 points`
- sur une page `watch`, un bouton `Résumer` apparaît aussi à côté des actions vidéo
- dans la barre d'outils Firefox (icône de l'extension) ou via la page d'options :
  - choix de la langue de l'extension (Français, Anglais, Auto)
  - activation ou désactivation de l'envoi automatique sur Gemini (permettant de sélectionner un modèle spécifique avant d'envoyer)
  - personnalisation du texte du prompt avec des modèles rapides (résumé classique, 5 idées clés, plan détaillé, vulgarisation, lien seul)
- au clic, l'extension ouvre Gemini avec un prompt contenant ce texte et l'URL normalisée de la vidéo
- sur Gemini, le prompt est injecté et envoyé automatiquement (ou laissé prêt à l'envoi si l'option est désactivée)

## Site web

Le site de présentation de l'extension est versionné dans le même dépôt, dans le dossier `docs/`.

Une fois GitHub Pages configuré sur la branche `main` avec le dossier `/docs`, le site est disponible à l'adresse :

`https://epikaigle.github.io/gemini-youtube-summarizer/`

Le site contient :
- une landing page courte et responsive
- une démonstration visuelle du flux YouTube → Résumer → Gemini
- un bouton d'installation vers la fiche officielle Firefox Add-ons
- une présentation du prompt personnalisable et de la confidentialité
- une page de politique de confidentialité
- des liens vers le code source et Firefox Add-ons

## Structure

- `manifest.json` : configuration de l'extension (Manifest V3)
- `popup.html` : interface rapide accessible au clic sur l'icône de la barre d'outils Firefox
- `content.js` : logique YouTube, détection des menus, extraction des URLs, bouton `watch`, boutons multilingues
- `gemini_auto_submit.js` : logique Gemini, remplissage du prompt et envoi automatique ou manuel
- `options.html`, `options.css`, `options.js` : interface complète de réglages (langue, envoi auto, prompt)
- `_locales/` : dictionnaires i18n officiels (`fr`, `en`, `es`)
- `icons/` : icônes officielles de l'extension
- `docs/` : site GitHub Pages de présentation de l'extension

## Installation locale dans Firefox

1. Ouvrir `about:debugging#/runtime/this-firefox`
2. Cliquer sur `Charger un module complémentaire temporaire`
3. Sélectionner `manifest.json`
4. Recharger YouTube avec `Ctrl+Shift+R`

## Options et barre d'outils

En cliquant sur l'icône de l'extension dans la barre d'outils ou via `about:addons` :
- **Langue d'affichage** : Français (`fr`), English (`en`), ou détection automatique du navigateur.
- **Envoi automatique sur Gemini** :
  - *Coché* : Gemini envoie la requête immédiatement à l'ouverture de l'onglet.
  - *Décoché* : Le prompt arrive directement dans la zone de texte de Gemini sans être envoyé. Vous pouvez ainsi tranquillement sélectionner votre modèle (Flash, Pro, Advanced...) avant de cliquer sur Envoyer.
- **Texte personnalisé du prompt** : Préréglages en un clic ou rédaction libre.

## Soumission AMO

Fichiers utiles pour la soumission Firefox Add-ons :
- `manifest.json`
- `PRIVACY_POLICY.md`
- `AMO_REVIEW_NOTES.md`

Archive de soumission :
- générer une archive propre avec `npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files README.md TESTING.md AMO_SUBMISSION.md AMO_REVIEW_NOTES.md PRIVACY_POLICY.md "docs/**"`
- envoyer ensuite l’archive sur le portail développeur AMO

## Licence

Ce projet est publié sous **The Unlicense**. Voir `LICENSE`.

## Notes


- Les fichiers `META-INF/` ne font pas partie des sources. Ils sont générés lors du packaging/signature.
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

Le comportement dépend du DOM de YouTube et de Gemini ; des ajustements peuvent donc être nécessaires si leurs interfaces changent.
