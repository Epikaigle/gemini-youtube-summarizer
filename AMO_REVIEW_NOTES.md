# Notes de revue AMO

## Fonctionnement

Cette extension ajoute une action `Résumer` (ou `Summarize` en anglais) sur YouTube :
- dans les menus `3 points` des cartes vidéo ;
- sur la page `watch`, à côté des actions de la vidéo.

Depuis l'icône de la barre d'outils (popup) ou la page d'options, l'utilisateur dispose de :
1. **Sélecteur de langue** : Français (`fr`), Anglais (`en`) ou Automatique selon le navigateur.
2. **Option d'envoi automatique sur Gemini** :
   - *Activé* (par défaut) : le script injecte le prompt et déclenche automatiquement l'envoi dès le chargement de Gemini.
   - *Désactivé* : le script insère le prompt dans la zone de texte de Gemini, lui donne le focus et s'arrête sans cliquer sur le bouton d'envoi. Cela permet à l'utilisateur de choisir manuellement le modèle souhaité (Gemini Flash, Gemini Pro, Advanced...) ou d'affiner sa question avant de soumettre.
3. **Personnalisation du prompt** : modèles prédéfinis (résumé classique, 5 idées clés, plan structuré, vulgarisation, lien seul) et zone de saisie libre.

Au clic sur le bouton de l'extension :
`Résume-moi la vidéo : https://www.youtube.com/watch?v=VIDEO_ID`

## Données transmises

L’extension transmet uniquement l’URL de la vidéo YouTube choisie par l’utilisateur et le texte personnalisé du prompt, uniquement après un clic sur `Résumer`.

Les préférences de l'utilisateur (texte du prompt, activation de l'envoi auto, langue) sont stockées strictement en local via `storage.local`. Aucune donnée n’est transmise à des tiers ou au développeur.

La déclaration `browsingActivity` dans le manifeste correspond ici au fait d’envoyer l’URL exacte de la vidéo sélectionnée à Gemini.

## Revue technique

- aucun code distant ;
- aucun code minifié ;
- aucune dépendance npm au runtime ;
- aucune collecte vers un serveur du développeur ;
- permission `storage` utilisée uniquement pour conserver les préférences utilisateur locales ;
- popup légère accessible depuis la barre d'outils (`popup.html`).

## Compatibilité

Le manifeste déclare `gecko.strict_min_version: 140.0` et `gecko_android.strict_min_version: 142.0` pour s’aligner avec la gestion récente par Firefox des déclarations de collecte et de transmission de données.
