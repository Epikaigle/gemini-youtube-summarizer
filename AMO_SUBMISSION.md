# Soumission Firefox Add-ons

## Archive a envoyer

Fichier genere :

`web-ext-artifacts/r_sum_youtube_par_gemini-3.7.zip`

AMO accepte les archives `.zip` pour la soumission.

Commande de generation :

`npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files README.md TESTING.md AMO_SUBMISSION.md AMO_REVIEW_NOTES.md PRIVACY_POLICY.md docs`

Le dossier `docs/` contient le site GitHub Pages et ne doit pas etre inclus dans l'archive de l'extension.

## Fichiers utiles

- Politique de confidentialite : `PRIVACY_POLICY.md`
- Notes pour les reviewers : `AMO_REVIEW_NOTES.md`

## Points a renseigner sur AMO

- Nom : `Resume YouTube par Gemini`
- Resume court : extension qui ajoute `Resumer` sur YouTube et envoie l'URL de la video choisie a Gemini avec un texte personnalisable
- Politique de confidentialite : reprendre le contenu de `PRIVACY_POLICY.md`
- Notes de revue : reprendre le contenu de `AMO_REVIEW_NOTES.md`

## Etat technique

- archive valide selon `web-ext lint`
- aucune erreur
- aucun warning
- manifeste compatible avec la declaration Firefox de transmission de donnees
- permission `storage` utilisee uniquement pour le texte personnalise local
