# 🚀 Spécifications Techniques et Analyse de Viabilité - OpenWhats

Ce document répertorie et classe les fonctionnalités de l'application OpenWhats par ordre décroissant de viabilité technique. L'objectif est de maximiser la stabilité de l'application, de planifier les efforts de développement et d'anticiper la dette technique liée aux futures mises à jour de WhatsApp Web.

---

## 🟢 Étage 1 : Fonctionnalités Hautement Viables (Contrôle Natif Electron)
*Ces fonctionnalités dépendent exclusivement des API internes d'Electron et du système d'exploitation Linux. Elles offrent une fiabilité absolue (100%) car elles sont totalement imperméables aux modifications de l'interface de WhatsApp Web.*

### 1. Floutage sur Perte de Focus (Anti-Snooping)
* **Concept :** Masquer instantanément le contenu des conversations dès que l'utilisateur quitte l'application ou change de fenêtre.
* **Architecture :** Écoute des événements de focus natifs de la `BrowserWindow`.
* **Implémentation Technique :**
    Dans le processus principal (`main.js`), on intercepte les signaux `blur` et `focus`. Pour éviter tout clignotement ou latence, on injecte directement une règle CSS globale via `insertCSS` au moment précis de la perte de focus, puis on la retire dès que la fenêtre redevient active.
    ```javascript 
    let blurKey;
    mainWindow.on('blur', async () => {
        blurKey = await mainWindow.webContents.insertCSS(
            'body { filter: blur(15px) !important; pointer-events: none !important; }'
        );
    });
    mainWindow.on('focus', async () => {
        if (blurKey) {
            await mainWindow.webContents.removeInsertedCSS(blurKey);
        }
    });
    ```

### 2. Menu d'Accès Rapide (Tray Menu / Zone de Notification)
* **Concept :** Ancrer l'application dans la barre supérieure ou les indicateurs système pour minimiser la fenêtre ou fermer l'application proprement.
* **Architecture :** Utilisation des modules natifs `Tray` et `Menu` d'Electron.
* **Implémentation Technique :**
    Instancier l'objet `Tray` dans le cycle de vie `app.whenReady()`. Pour offrir un vrai comportement d'application de messagerie, on intercepte l'événement `close` de la fenêtre principale pour l'annuler et simplement masquer la fenêtre (`mainWindow.hide()`), sauf si l'utilisateur a explicitement cliqué sur "Quitter" depuis le menu de la barre système.
    ```javascript
    const { Tray, Menu } = require('electron');
    let tray = null;

    function createTray() {
        tray = new Tray(path.join(__dirname, 'build/tray-icon.png'));
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Afficher OpenWhats', click: () => mainWindow.show() },
            { type: 'separator' },
            { label: 'Quitter', click: () => { app.isQuitting = true; app.quit(); } }
        ]);
        tray.setContextMenu(contextMenu);
    }
    ```

### 3. Volet de Notes Intégré (Side-panel Markdown)
* **Concept :** Un bloc-notes persistant au format Markdown juxtaposé à l'interface de WhatsApp, fonctionnant de manière autonome et locale.
* **Architecture :** Partitionnement de l'interface Electron via une architecture à double panneau.
* **Implémentation Technique :**
    La `BrowserWindow` principale ne pointe plus directement vers l'URL distante de WhatsApp, mais charge un fichier HTML local (`index.html`). Ce fichier utilise un découpage CSS (Grid ou Flexbox) composé de deux zones distinctes :
    1. Une balise `<webview>` (ou une iframe isolée) configurée avec la session WhatsApp Web.
    2. Un conteneur HTML classique gérant l'éditeur Markdown (alimenté par une bibliothèque légère comme `marked` ou un éditeur minimaliste en JavaScript pur).
    Les notes saisies sont lues et écrites sur le disque de manière asynchrone via le module `fs` dans le répertoire sécurisé de l'application (`app.getPath('userData')/notes.md`).

---

## 🟡 Étage 2 : Fonctionnalités Moyennement Viables (Dépendances Environnementales)
*Ces fonctionnalités demandent une vigilance accrue car leur comportement dépend des configurations du système de l'utilisateur final ou de signaux basiques de la page web.*

### 4. Raccourci Clavier Global (Hotkeys)
* **Concept :** Masquer ou afficher instantanément la fenêtre OpenWhats à l'aide d'un raccourci clavier universel (ex: `Ctrl + Alt + W`).
* **Architecture :** Enregistrement auprès du serveur d'affichage (Wayland) via le module `globalShortcut`.
* **Implémentation Technique :**
    Le risque principal réside dans la collision avec les raccourcis natifs d'autres applications lourdes (comme les IDE de développement). **Contrainte stricte :** Le raccourci ne doit jamais être écrit en dur dans le code. L'application doit lire cette configuration depuis un fichier JSON local (`config.json`). Si le module renvoie `false` lors de l'appel à `register`, l'application doit intercepter l'erreur sans planter et désactiver proprement l'option.
    ```javascript
    const { globalShortcut } = require('electron');

    app.whenReady().then(() => {
        const success = globalShortcut.register('Ctrl+Alt+W', () => {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });
        if (!success) console.warn("Le raccourci global configuré est déjà verrouillé par le système.");
    });
    ```

### 5. Indicateur de Notifications sur le Dock (Badge Count)
* **Concept :** Afficher dynamiquement le nombre cumulé de messages non lus sur l'icône de l'application dans le dock Ubuntu.
* **Architecture :** Écoute du DOM WhatsApp couplée à l'API système `app.setBadgeCount()`.
* **Implémentation Technique :**
    L'API d'Electron a un support inégal selon les environnements de bureau Linux (elle fonctionne parfaitement sur GNOME avec Dash-to-Dock et sur KDE Plasma, mais peut échouer sur des configurations épurées). Côté web, pour éviter l'effondrement dû au renommage des classes CSS de WhatsApp, on n'inspecte pas les pastilles graphiques. On implémente un `MutationObserver` dans un script `preload.js` ciblant l'élément `<title>` du DOM, car WhatsApp reflète systématiquement le nombre de notifications dans le titre de l'onglet (ex: *(3) WhatsApp*).
    ```javascript
    // Dans preload.js
    const { ipcRenderer } = require('electron');
    window.addEventListener('DOMContentLoaded', () => {
        const observer = new MutationObserver(() => {
            const match = document.title.match(/\((\d+)\)/);
            const count = match ? parseInt(match[1], 10) : 0;
            ipcRenderer.send('update-badge-count', count);
        });
        observer.observe(document.querySelector('title'), { childList: true });
    });

    // Dans main.js
    ipcMain.on('update-badge-count', (event, count) => {
        app.setBadgeCount(count); 
    });
    ```

---

## 🔴 Étage 3 : Fonctionnalités Faiblement Viables (Forte Dette Technique)
*Ces fonctionnalités touchent au cœur de la structure de WhatsApp Web. Elles nécessitent des manipulations complexes (DOM, injections) et présentent un risque de rupture élevé à la moindre mise à jour poussée par Meta.*

### 6. Mode "Strict Privacy" (Masquage Dynamique)
* **Concept :** Appliquer un flou sur les listes de contacts et les aperçus de messages, levé uniquement au survol de la souris.
* **Risque de rupture :** WhatsApp Web utilise des classes CSS obfusquées et générées de manière dynamique à chaque build de leur application React. Cibler des classes directes est une garantie de panne immédiate à court terme.
* **Solution d'Implémentation :**
    Pour contourner le chiffrement des noms de classe, l'injection CSS doit exploiter uniquement des **sélecteurs structurels sémantiques** (attributs HTML stables comme `role`, `data-testid`, ou `dir`).
    ```css
    /* Injection via preload.js - Ciblage par attribut de composant plutôt que par classe */
    div[data-testid="cell-frame-container"] img, 
    div[data-testid="cell-frame-container"] span[dir="auto"] {
        filter: blur(10px) !important;
        transition: filter 0.25s ease-in-out;
    }
    
    div[data-testid="cell-frame-container"]:hover img,
    div[data-testid="cell-frame-container"]:hover span[dir="auto"] {
        filter: blur(0px) !important;
    }
    ```

### 7. Thème "Noir Profond" (OLED Dark Mode)
* **Concept :** Remplacer le gris foncé par défaut de WhatsApp par un noir pur (`#000000`) pour soulager la fatigue oculaire et s'adapter aux configurations Linux sombres.
* **Risque de rupture :** WhatsApp Web met fréquemment à jour ses variables de thémisation ou la structure de ses nœuds DOM parents, ce qui peut créer des zones de texte invisibles (texte noir sur fond noir) lors des mises à jour.
* **Solution d'Implémentation :**
    Injecter une feuille de style maîtresse qui surcharge de manière agressive les variables globales de couleur injectées à la racine du document (`:root` ou `body.theme-dark`). L'utilisation du flag `!important` est obligatoire pour contrer l'injection en ligne de React.
    ```css
    body.theme-dark {
        --app-background: #000000 !important;
        --main-background: #000000 !important;
        --panel-background: #0a0a0a !important;
        --sidebar-background: #050505 !important;
        --incoming-chat-bubble: #121212 !important;
    }
    ```

### 8. Gestionnaire de Réponses Rapides (Snippets Manager)
* **Concept :** Injecter instantanément des réponses types textuelles configurées à l'avance dans le champ d'écriture actif.
* **Risque de rupture :** Le champ d'écriture de WhatsApp n'est pas un formulaire standard (`<textarea>`). Il s'agit d'un éditeur riche (`contenteditable`) géré par le framework interne *Draft.js* lié au state React. Modifier brutalement la propriété `.innerText` via JavaScript modifie le texte à l'écran mais met à jour l'état de React à blanc. Dès que l'utilisateur valide, le message s'efface.
* **Solution d'Implémentation :**
    Le script injecté doit simuler un événement d'écriture utilisateur natif de bas niveau au focus du champ, forçant Draft.js à intercepter l'action et à synchroniser son DOM virtuel. On utilise la commande système d'édition du navigateur :
    ```javascript
    function insertSnippetText(text) {
        const inputField = document.querySelector('div[contenteditable="true"][data-tab="10"]');
        if (inputField) {
            inputField.focus();
            // Utilisation de execCommand pour forcer la mise à jour de l'état interne de Draft.js/React
            document.execCommand('insertText', false, text);
        }
    }
    ```

### 9. Tri Automatique des Médias Téléchargés
* **Concept :** Classer automatiquement les fichiers téléchargés (images, documents) dans des répertoires distincts au nom du contact ou du groupe d'origine.
* **Risque de rupture :** L'API d'Electron qui gère les téléchargements (`will-download`) intercepte le flux réseau brut (URL, cookie, taille). Elle est isolée et n'a aucune information contextuelle sur la fenêtre graphique ou sur l'identité du contact émetteur.
* **Solution d'Implémentation :**
    Il est nécessaire de concevoir une passerelle d'état asynchrone entre l'interface utilisateur et le processus principal.
    1. Dans `preload.js`, on place un écouteur d'événements global sur la page Web. Dès qu'un clic est détecté sur un bouton de téléchargement, le script analyse immédiatement l'en-tête de la discussion active pour en extraire le titre textuel (le nom du contact/groupe) et l'envoie via IPC : `ipcRenderer.send('set-active-download-context', clientName)`.
    2. Dans `main.js`, on stocke temporairement ce nom dans une variable volatile, après l'avoir nettoyé de tout caractère spécial pour éviter les failles d'injection de chemin (ex: `../`).
    3. Lorsque l'événement de session `will-download` se déclenche immédiatement après, on intercepte le fichier et on modifie de force sa trajectoire d'écriture.
    ```javascript
    // Dans main.js
    let currentDownloadContext = "Divers";

    ipcMain.on('set-active-download-context', (event, clientName) => {
        // Sanitarisation stricte pour éviter l'altération de l'arborescence système
        currentDownloadContext = clientName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "Divers";
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
        const targetFolder = path.join(app.getPath('home'), 'WhatsApp_Media', currentDownloadContext);
        
        // Création du dossier si inexistant avant assignation
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }
        
        item.setSavePath(path.join(targetFolder, item.getFilename()));
    });
    ```
    *Avertissement architectural : Ce mécanisme présente une faille de synchronisation (Race Condition) si l'utilisateur déclenche plusieurs téléchargements simultanés tout en changeant rapidement de fil de discussion.*