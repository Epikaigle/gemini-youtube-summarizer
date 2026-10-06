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
- bouton séparé du bloc `J’aime / Je n’aime pas`
- espacement cohérent avec `Partager`

## Gemini

Vérifier :
- ouverture de Gemini avec `?prompt=...`
- prompt bien injecté dans la zone de saisie
- si « Envoyer automatiquement » est actif : envoi déclenché quand l’interface est prête
- si « Envoyer automatiquement » est inactif : le prompt reste dans la zone de texte, le champ a le focus, l'URL est nettoyée, et l'utilisateur peut choisir son modèle (Flash, Pro...) avant de cliquer sur Envoyer

## Barre d'outils (Popup) et Options

Vérifier :
- ouverture rapide de la popup au clic sur l'icône dans la barre d'outils
- sélecteur de langue : basculer entre Français et Anglais met à jour l'interface immédiatement
- les boutons sur YouTube s'adaptent à la langue choisie (« Résumer » en FR, « Summarize » en EN)
- bascule de l'option « Envoyer automatiquement le prompt »
- sauvegarde d’un texte personnalisé avant le lien
- raccourcis de prompt (chips) : Classic, 5 points, Plan, Simple, Lien seul
- aperçu du prompt mis à jour en direct
- réinitialisation des paramètres par défaut
- lien « Ouvrir en plein écran » ouvre bien `options.html` dans un nouvel onglet

## Régressions visuelles

Vérifier :
- icône visible à côté de `Résumer`
- rendu correct en thème clair
- rendu correct en thème sombre
- rendu correct dans les menus `yt-list-view-model`, `tp-yt-paper-listbox` et `yt-sheet-view-model`
