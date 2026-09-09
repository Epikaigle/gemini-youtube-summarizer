# Notes de revue AMO

## Fonctionnement

Cette extension ajoute une action `Resumer` sur YouTube :
- dans les menus `3 points` des cartes video ;
- sur la page `watch`, a cote des actions de la video.

L'utilisateur peut personnaliser le texte place avant le lien YouTube depuis la page d'options de l'extension. Par defaut, au clic, elle ouvre Gemini avec un prompt de la forme :

`Resume-moi la video : https://www.youtube.com/watch?v=VIDEO_ID`

Puis le content script sur `https://gemini.google.com/*` remplit le champ de saisie et tente l'envoi automatiquement.

## Donnees transmises

L'extension transmet uniquement l'URL de la video YouTube choisie par l'utilisateur et le texte personnalise du prompt, uniquement apres clic sur `Resumer`.

Le texte personnalise est stocke localement via `storage.local`. Il n'est jamais transmis au developpeur.

Inferer `browsingActivity` dans le manifeste correspond ici au fait d'envoyer l'URL exacte de la video selectionnee a Gemini.

## Revue technique

- aucun code distant ;
- aucun code minifie ;
- aucune dependance npm au runtime ;
- aucune collecte vers un serveur du developpeur ;
- permission `storage` utilisee uniquement pour conserver le texte personnalise local ;
- aucun background script.

## Compatibilite

Le manifeste declare `gecko.strict_min_version: 140.0` et `gecko_android.strict_min_version: 142.0` pour s'aligner avec la gestion Firefox recente des declarations de collecte/transmission de donnees.
