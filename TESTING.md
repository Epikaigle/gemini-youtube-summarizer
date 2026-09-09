# Checklist de test manuel

## YouTube

Vérifier sur chaque page :
- `Résumer` dans le menu `3 points`
- pas de doublon de bouton
- URL de la vidéo correcte envoyée à Gemini

Pages à tester :
- `https://www.youtube.com/`
- `https://www.youtube.com/feed/subscriptions`
- une page `watch`
- une page `watch` avec playlist
- une page de chaîne
- un onglet `videos`
- un onglet `streams`

## Page watch

Vérifier aussi :
- bouton `Résumer` visible à côté des actions vidéo
- bouton séparé du bloc `J'aime / Je n'aime pas`
- espacement cohérent avec `Partager`

## Gemini

Vérifier :
- ouverture de Gemini avec `?prompt=...`
- prompt bien injecté
- envoi automatique déclenché quand l'interface est prête

## Options

Vérifier :
- ouverture de la page d'options depuis les details de l'extension
- sauvegarde d'un texte personnalise avant le lien
- sauvegarde d'un champ vide pour envoyer uniquement le lien
- aperçu du prompt mis a jour
- message d'erreur visible si le stockage est indisponible
- Gemini reçoit le texte personnalise suivi de l'URL YouTube
- réinitialisation vers `Résume-moi la vidéo :`

## Régressions visuelles

Vérifier :
- icône visible à côté de `Résumer`
- rendu correct en thème clair
- rendu correct en thème sombre
- rendu correct dans les menus `yt-list-view-model`, `tp-yt-paper-listbox` et `yt-sheet-view-model`
