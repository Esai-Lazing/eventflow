# Plan de Correction des Failles - Invitation Digitale

## 1. Persistance des Données (Faille de Logique)
**Problème :** Les formulaires "Suggérer une musique" et "Livre d'Or" ne sont pas connectés au backend. Les données saisies sont perdues.
- [ ] Ajouter les routes `suggestMusic` et `postGuestbook` dans `services/api.js`.
- [ ] Mettre à jour `MusicModal.jsx` (intégré dans `InvitationPage.jsx`) pour appeler l'API au submit.
- [ ] Mettre à jour `GuestbookModal.jsx` (intégré dans `InvitationPage.jsx`) pour appeler l'API au submit.

## 2. Sécurisation du RSVP (Broken Access Control)
**Problème :** L'action de RSVP repose uniquement sur le nom de l'invité.
- [ ] Modifier `handleRSVP` pour envoyer le `token` d'invité unique dans la requête POST.
- [ ] S'assurer que le backend valide que le `token` correspond bien au `guest_name`.

## 3. Protection de la Vie Privée (Divulgation d'Infos)
**Problème :** Un invité peut voir les noms complets de tous les autres invités à sa table.
- [ ] Restreindre l'affichage des noms (ex: "Jean D." au lieu de "Jean Dupont") ou supprimer la liste si elle n'est pas essentielle.

## 4. Sécurisation du Check-in (IDOR)
**Problème :** Le QR Code expose le token directement pour le check-in.
- [ ] S'assurer que la route de check-in (`/check-in/:token`) vérifie le rôle de l'utilisateur (doit être Staff/Admin).
