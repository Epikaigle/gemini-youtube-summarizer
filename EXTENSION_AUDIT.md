# Audit de l'extension — 8 octobre 2026

Sources examinées : manifest, popup/options, dictionnaires FR/EN/ES, script YouTube
et automatisation Gemini. Corrections réunies dans la version **3.8.1**.

## Bilan

L'interface reste cohérente avec l'extension ; sa principale faiblesse était sa densité.
La page complète réutilisait trop de dimensions de la popup. Les réglages étaient
déjà stockés localement, les URL YouTube normalisées et les observers de menus limités
dans le temps. Ces pratiques sont conservées.

L'audit initial a corrigé sept problèmes : trois de priorité haute et quatre de priorité moyenne.
La vérification complémentaire ci-dessous ajoute deux corrections de confort et d'accessibilité.
Aucun changement de permissions ni de service externe.

| Priorité | Problème et effet | Correction |
| --- | --- | --- |
| Haute | `options.css` : `width: 380px` combiné à `max-width: 100vw` fait dépendre la largeur de la popup du viewport que Firefox doit justement dimensionner. Dans le profil neuf testé, la version précédente restait à 300 px. | Largeur déterministe de 420 px sur le body, hauteur limitée et défilement vertical. Le premier clic donne 420 × 600 px dans les profils de test. |
| Haute | `options.css`/`options.html` : panneau de 640 px, consigne à 12,5 px, champ de quatre lignes et aperçu limité à 100 px. Le confort de rédaction reste celui d'une petite popup. | Panneau jusqu'à 920 px, texte principal de 16 px, champ d'au moins 220 px et aperçu intégral dans l'onglet. Mise en page adaptée aux écrans étroits. |
| Haute | `content.js` : le prompt par défaut était calculé avant la restauration de la langue. Un changement de langue seul pouvait conserver l'ancienne consigne ; les suppressions simultanées des réglages avaient le même défaut. | Restaurer la langue avant le prompt et recalculer le défaut après les changements de langue, sans remplacer les consignes personnalisées ou vides. |
| Moyenne | `options.js` : changer de langue remplaçait un champ vide par la consigne par défaut, annulant « Lien seul ». La langue était enregistrée séparément des autres réglages. | Conserver le champ vide et enregistrer tous les réglages ensemble avec Enregistrer. La traduction de l'interface reste immédiate. |
| Moyenne | `popup.html` : libellé du champ masqué ; aide trop peu explicite sur ce qui est envoyé. | Libellé visible « Consigne à envoyer avant le lien YouTube », aide qui explique l'ajout du lien et aperçu présenté comme un exemple. FR/EN/ES synchronisés. |
| Moyenne | `icons/` : le dessin visible du PNG de 96 px ne mesure que 62 × 59 px. L'icône semble plus petite que ses voisines. | SVG autonome qui change le viewport autour du PNG d'origine, sans modifier son dessin. Le visuel occupe environ 97 % de la largeur. Référence dans le manifest et les en-têtes ; taille 32 ajoutée. Il s'agit d'un emballage SVG du bitmap, pas d'un nouveau dessin vectoriel. |
| Moyenne | Réglages : `aria-labelledby="lang-label"` pointait vers un ID absent ; descriptions mal associées, contraste du texte blanc sur violet sombre insuffisant, erreurs parfois silencieuses. | IDs et descriptions corrects, focus sur le lien d'options, contrastes renforcés, animations supprimées si demandé. Formulaire bloqué pendant lecture/écriture, erreurs persistantes et protection en cas d'échec de lecture. |

L'ouverture de l'onglet passe désormais par `runtime.openOptionsPage()`, qui utilise
la page déclarée dans le manifest. Le bouton dispose aussi d'un vrai lien HTML.
Les boutons d'enregistrement restent accessibles pendant le défilement de la popup.

La correction du dimensionnement suit le fonctionnement documenté par
[Mozilla](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups) :
Firefox mesure le body avant l'affichage de la popup. La bande quasi vide signalée
n'a pas été reproduite exactement dans le profil neuf ; son lien avec la contrainte
de largeur est donc une hypothèse étayée par le mauvais dimensionnement observé.
Il reste à confirmer la disparition du symptôme dans le profil habituel de l'utilisateur.

## Vérifications

- Firefox **157.0**, geckodriver **0.37.1**, mode headless, installation temporaire dans
  deux profils neufs indépendants : premier clic à 420 × 600 px, thèmes clair/sombre.
- Ouverture de la vraie page d'extension et de son onglet d'options, sauvegarde,
  restauration, réinitialisation, langues FR/EN/ES et conservation du mode « lien seul ».
- Contrôle des largeurs 320/390/768 px, des libellés visibles, de l'aperçu long,
  des références ARIA et du chargement de l'icône.
- Popup contrainte à 420 × 600 px : absence de défilement horizontal et accès aux
  actions pendant le défilement ; erreurs de lecture/écriture du stockage simulées.
- Script YouTube exécuté sur une fixture locale : langue au démarrage, langue modifiée,
  prompt personnalisé/vide, suppression simultanée des réglages et URL normalisée.
- Syntaxe JavaScript et `git diff --check` ; `web-ext lint` : **0 erreur, 0 avertissement,
  0 notice**.

Tests reproductibles : `python3 tests/extension-firefox.py`. Les captures et résultats
locaux se trouvent dans `artifacts/extension/`, exclu du paquet.

## Vérification complémentaire de la page de préférences

Le zoom de page à **200 % et 400 %** conserve une mise en page sans débordement horizontal.
Un cas supplémentaire a été corrigé : à **320 px avec le texte seul agrandi à 200 %**,
les titres et certains mots longs en anglais pouvaient dépasser la largeur du formulaire.
Les titres, légendes et explications peuvent maintenant se couper à la ligne lorsque
l'espace disponible est insuffisant. Le cas est couvert dans les trois langues et les
deux thèmes, avec un prompt de 1 200 caractères sans espaces.

Le parcours clavier est également exercé : Tab entre les contrôles, flèches pour la
langue, Espace pour la bascule et Entrée pour les modèles de prompt/enregistrement.
Une perte de focus pendant la désactivation temporaire des contrôles a été corrigée :
le focus revient au contrôle utilisé après la sauvegarde, sauf si l'utilisateur l'a
déplacé hors du formulaire pendant l'attente.

La page charge environ **42 ko de fichiers locaux** (HTML, CSS, JavaScript et icône),
utilise les polices système et ne demande aucune bibliothèque ni ressource distante.
L'aperçu est mis à jour par un changement de texte limité à la longueur du prompt.
Il n'y a pas de besoin identifié d'ajouter une optimisation de chargement ou un framework.

## Vérification des traductions et préparation de la soumission

- Titres des préférences et nom espagnol traduits ; libellés, modèles, aides et messages d’état cohérents avec les catalogues FR/EN/ES.
- README et politique de confidentialité utilisateur disponibles en français, anglais et espagnol. Les guides techniques restent en français.
- Site : corps complet de la politique, titres de page, menu mobile, thèmes, commandes de démo, infobulles et descriptions accessibles traduits. Le chinois déjà proposé par le site est conservé.
- Notes AMO actualisées pour 3.8.1, ajout de l’espagnol et clarification de la transmission à Gemini. Le fichier `AMO_LISTING.md` fournit les noms, résumés, descriptions et notes de version FR/EN/ES à copier dans AMO.
- `node scripts/translation-check.mjs` contrôle les clés, la cohérence des catalogues et les liens de documentation. Ce contrôle est ajouté au workflow GitHub de validation.
- Tests du site avec Playwright 1.55.0 / Firefox : six largeurs (360 à 1440 px), deux thèmes et changements FR/EN/ES/ZH sur ordinateur et mobile, avec navigation vers la confidentialité et commandes traduites. Tous les contrôles passent.
- Archive ZIP et copie XPI 3.8.1 identiques, 15 fichiers, 48 048 octets ; les sources de chaque fichier inclus correspondent au paquet. Lint avec les exclusions de soumission : 0 erreur, 0 avertissement, 0 notice.

La vérification publique du 8 octobre 2026 a trouvé GitHub encore au commit `dab1767` et AMO en version **3.8**. La fiche AMO contient du français dans sa variante anglaise et aucune description espagnole. Les corrections 3.8.1 sont désormais versionnées dans le dépôt GitHub. Les workflows contrôlent le site, les traductions et la génération d’une archive AMO non signée. La publication de la nouvelle version sur AMO reste à effectuer. Les textes de la fiche AMO doivent être mis à jour séparément du fichier de l’extension.

## Points restant à vérifier avant publication

1. Recharger l'extension corrigée dans le Firefox habituel et vérifier le tout premier
   clic, ainsi que l'ouverture depuis le menu des extensions.
2. Tester le parcours réel YouTube → Gemini, connecté au compte habituel, en modes
   automatique et manuel. Les sélecteurs de ces deux services peuvent évoluer ; les
   tests locaux ne certifient pas leur DOM actuel ni le modèle sélectionné.
3. Pour une installation persistante, soumettre le paquet corrigé à la signature AMO.
   La nouvelle version nécessite encore la soumission, la validation et la signature sur AMO.

Firefox 140 ESR et Firefox Android n'ont pas été exécutés dans cet audit.
