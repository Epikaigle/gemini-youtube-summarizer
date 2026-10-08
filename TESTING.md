# Checklist de test manuel

## Tests automatisés de l'extension

Prérequis : `firefox` et `geckodriver` sur le PATH ; une version de geckodriver qui
accepte `--allow-system-access` (exécuté ici avec Firefox 157.0 et geckodriver 0.37.1).

```bash
python3 tests/extension-firefox.py
```

Le test installe temporairement les sources dans des profils jetables, puis vérifie :
- le premier clic sur le vrai bouton de la barre d'outils, avant de charger les options ;
- les thèmes clair et sombre, les trois langues et les largeurs 320, 390 et 768 px ;
- le zoom de page à 200/400 %, le texte à 200 % sur 320 px et un prompt de 1 200 caractères sans espaces ;
- le parcours clavier (Tab, flèches, Espace, Entrée), les indicateurs de focus et sa conservation après enregistrement ;
- l'enregistrement, le rechargement, la réinitialisation et le prompt « lien seul » ;
- les références des libellés accessibles et le chargement de l'icône ;
- la popup à 420 × 600 px sans débordement horizontal, avec les actions visibles ;
- les erreurs de stockage simulées, sans écrasement après un échec de lecture ;
- l'ouverture de la page d'options par l'API de l'extension ;
- les changements de langue et de prompt dans le script YouTube sur un DOM local.

Les captures et les résultats sont dans `artifacts/extension/`. Aucun profil Firefox
personnel n'est modifié. Ces tests n'envoient pas de requête à Gemini et ne remplacent
pas les vérifications du DOM réel de YouTube/Gemini ci-dessous.

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
- premier clic après installation/rechargement : la popup s'affiche entièrement en largeur, sans bande vide
- ouverture depuis la barre d'outils et depuis le menu des extensions
- sélecteur de langue : basculer entre Français, Anglais et Espagnol met à jour l'interface immédiatement ; Enregistrer applique le choix à YouTube
- les boutons sur YouTube s'adaptent à la langue choisie (« Résumer » en FR, « Summarize » en EN, « Resumir » en ES)
- bascule de l'option « Envoyer automatiquement le prompt »
- sauvegarde d’un texte personnalisé avant le lien
- après « Lien seul », changer de langue conserve le champ vide
- raccourcis de prompt (chips) : Classic, 5 points, Plan, Simple, Lien seul
- aperçu du prompt mis à jour en direct
- réinitialisation des paramètres par défaut
- lien « Ouvrir les préférences dans un onglet » ouvre bien `options.html`
- page complète : consigne bien identifiée, zone de rédaction haute et aperçu sans hauteur tronquée
- clavier : choix de langue, bascule, presets, Enregistrer et lien vers l'onglet accessibles
- si la lecture du stockage échoue, une erreur reste visible et les réglages ne sont pas écrasés

## Régressions visuelles

Vérifier :
- icône visible à côté de `Résumer`
- rendu correct en thème clair
- rendu correct en thème sombre
- rendu correct dans les menus `yt-list-view-model`, `tp-yt-paper-listbox` et `yt-sheet-view-model`

## Traductions et site public

```sh
node scripts/translation-check.mjs
node scripts/site-check.mjs
# Avec Playwright installé et le site servi sur http://127.0.0.1:4173 :
node tests/site-visual.mjs
```

Le contrôle de traduction vérifie la présence des clés, la cohérence entre les dictionnaires de la popup et les catalogues Firefox, ainsi que les liens des README et politiques FR/EN/ES. Le test visuel couvre six largeurs et deux thèmes, puis les changements FR/EN/ES/ZH sur ordinateur et mobile : navigation vers la confidentialité, titres, menu, thème, pause et reprise de la démo.
