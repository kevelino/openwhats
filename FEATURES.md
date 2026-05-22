# 🚀 Fonctionnalités Exclusives - WhatsApp Linux Desktop (Electron)

Ce document détaille les fonctionnalités avancées et uniques intégrées à cette application. Contrairement aux wrappers standards qui se contentent d'afficher la version web, cette application exploite la puissance combinée de Node.js et du système d'exploitation Linux pour offrir une expérience enrichie, sécurisée et orientée productivité.

---

## 1. Sécurité et Respect de la Vie Privée (Privacy Engine)

### 🛡️ Mode "Strict Privacy" (Masquage Dynamique)
* **Le concept :** Protéger l'écran des regards indiscrets dans les espaces publics ou les bureaux partagés (open space).
* **Fonctionnement :** Lorsqu'il est activé via l'interface, l'application applique un filtre de flou (*blur*) automatique sur des éléments sensibles de l'interface de WhatsApp : la liste des contacts à gauche, les photos de profil, et les aperçus des derniers messages. 
* **Interaction :** Pour lire un message ou voir l'identité d'un contact, l'utilisateur a juste à passer le curseur de sa souris au-dessus de l'élément masqué. Le flou se dissipe instantanément et revient dès que la souris s'éloigne.

### 🎭 Floutage sur Perte de Focus (Anti-Snooping)
* **Le concept :** Masquer instantanément le contenu des conversations dès que l'utilisateur quitte l'application.
* **Fonctionnement :** L'application détecte en temps réel le comportement des fenêtres du système Linux. Dès que la fenêtre de WhatsApp perd le focus (si l'utilisateur clique sur une autre application ou change d'espace de travail), l'intégralité de l'interface WhatsApp devient floue ou est remplacée par un écran de veille minimaliste. Le contenu redevient visible uniquement lorsque l'application redevient la fenêtre active.

---

## 2. Intégration Native Ubuntu / Linux

### 📊 Indicateur de Notifications sur le Dock (Badge Count)
* **Le concept :** Connaître le nombre exact de messages en attente sans ouvrir l'application.
* **Fonctionnement :** Un script d'arrière-plan surveille discrètement les pastilles de notification de l'interface web. Il calcule la somme totale des messages non lus et transmet cette information directement au gestionnaire de fenêtres Linux (GNOME, KDE, etc.). L'icône de l'application dans le dock Ubuntu affiche alors un badge numérique rouge mis à jour en temps réel.

### 🍏 Menu d'Accès Rapide (Tray Menu / Zone de Notification)
* **Le concept :** Contrôler son statut et l'application depuis la barre supérieure ou inférieure de Linux.
* **Fonctionnement :** L'application s'ancre dans la zone des indicateurs système de Linux avec une icône dédiée. Un clic droit sur cette icône ouvre un menu contextuel natif permettant de :
    * Changer rapidement son statut de présence (En ligne, Occupé, Absent).
    * Masquer ou afficher instantanément la fenêtre principale.
    * Fermer complètement l'application en arrière-plan.

### ⌨️ Raccourci Clavier Global (Hotkeys)
* **Le concept :** Afficher ou masquer WhatsApp instantanément à tout moment, sans toucher à la souris.
* **Fonctionnement :** L'application s'enregistre auprès du serveur d'affichage Linux pour écouter une combinaison de touches globale (ex: `Ctrl + Alt + W`). Ce raccourci fonctionne même si l'utilisateur est en train de coder sur son IDE ou de naviguer sur le web. S'il est pressé, WhatsApp passe au premier plan ; s'il est pressé à nouveau, l'application se réduit discrètement.

---

## 3. Productivité Avancée (Espace de Travail)

### 📝 Volet de Notes Intégré (Side-panel Markdown)
* **Le concept :** Prendre des notes rapidement durant une discussion sans dépendre d'un éditeur externe.
* **Fonctionnement :** L'interface d'Electron est divisée en deux parties : la fenêtre principale affiche WhatsApp Web, tandis qu'un volet latéral escamotable sert de bloc-notes. L'utilisateur peut y rédiger des notes au format Markdown. Ces notes sont sauvegardées localement et automatiquement sur le disque dur de la machine Linux, de manière totalement indépendante des serveurs de WhatsApp.

### ⚡ Gestionnaire de Réponses Rapides (Snippets Manager)
* **Le concept :** Envoyer des messages récurrents, des liens ou des réponses types en un seul clic.
* **Fonctionnement :** Un panneau dédié permet à l'utilisateur de configurer et stocker des modèles de messages textuels. À côté du champ de saisie de WhatsApp, un menu discret affiche la liste de ces raccourcis. Un clic sur l'un d'eux injecte instantanément le texte pré-enregistré dans la barre de discussion de WhatsApp, prêt à être envoyé.

### 📁 Tri Automatique des Médias Téléchargés
* **Le concept :** Éviter l'accumulation chaotique de fichiers reçus dans le dossier "Téléchargements" global.
* **Fonctionnement :** L'application intercepte les requêtes de téléchargement de fichiers initiées dans WhatsApp (images, documents PDF, vidéos). Au lieu de tout envoyer en vrac, le système d'exploitation crée une arborescence propre dans le répertoire de l'utilisateur (ex: `~/WhatsApp_Media/`). Les fichiers sont automatiquement triés dans des sous-dossiers thématiques basés sur le nom du contact ou du groupe émetteur, ainsi que sur la date de réception.

---

## 4. Personnalisation Visuelle (Theming)

### 🌃 Thème "Noir Profond" (OLED Dark Mode)
* **Le concept :** Offrir un véritable confort visuel pour les écrans de type OLED ou le travail de nuit.
* **Fonctionnement :** WhatsApp Web propose nativement un mode sombre qui tire sur le gris foncé. Cette fonctionnalité applique une feuille de style personnalisée au démarrage qui remplace les fonds gris par un noir pur (`#000000`). Cela réduit drastiquement la fatigue oculaire et optimise la consommation d'énergie sur les écrans compatibles sous Linux.