# Notes de revue AMO

## Fonctionnement

Cette extension ajoute une action `Résumer` sur YouTube :
- dans les menus `3 points` des cartes vidéo ;
- sur la page `watch`, à côté des actions de la vidéo.

L’utilisateur peut personnaliser le texte placé avant le lien YouTube depuis la page d’options de l’extension. Par défaut, au clic, elle ouvre Gemini avec un prompt de la forme :

`Résume-moi la vidéo : https://www.youtube.com/watch?v=VIDEO_ID`

Puis le content script sur `https://gemini.google.com/*` remplit le champ de saisie et tente l’envoi automatiquement.

## Données transmises

L’extension transmet uniquement l’URL de la vidéo YouTube choisie par l’utilisateur et le texte personnalisé du prompt, uniquement après un clic sur `Résumer`.

Le texte personnalisé est stocké localement via `storage.local`. Il n’est jamais transmis au développeur.

La déclaration `browsingActivity` dans le manifeste correspond ici au fait d’envoyer l’URL exacte de la vidéo sélectionnée à Gemini.

## Revue technique

- aucun code distant ;
- aucun code minifié ;
- aucune dépendance npm au runtime ;
- aucune collecte vers un serveur du développeur ;
- permission `storage` utilisée uniquement pour conserver le texte personnalisé local ;
- aucun background script.

## Compatibilité

Le manifeste déclare `gecko.strict_min_version: 140.0` et `gecko_android.strict_min_version: 142.0` pour s’aligner avec la gestion récente par Firefox des déclarations de collecte et de transmission de données.
