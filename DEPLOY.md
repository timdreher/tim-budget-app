# GitHub Deploy – Anleitung für Claude Code

> Diese Datei ist eine Aufgabenliste für Claude Code im Terminal.
> Inhalt einfach als Prompt einfügen.

---

## Prompt (kopieren und in Claude Code einfügen)

```
Bitte richte das GitHub-Deployment für meine Budget-App ein.
Das Projektverzeichnis ist:
/Users/timdreher/Library/Mobile Documents/com~apple~CloudDocs/Finanzen/tim-budget-app

Erledige folgende Schritte der Reihe nach:

1. Prüfe ob `gh` (GitHub CLI) installiert ist und ob ich eingeloggt bin (`gh auth status`).
   Falls nicht eingeloggt: führe `gh auth login` aus.

2. Frag mich:
   a) Wie soll das GitHub-Repository heißen? (Vorschlag: tim-budget-app)
   b) Soll es public oder private sein?

3. Initialisiere ein Git-Repository im Projektverzeichnis (falls noch nicht vorhanden).

4. Erstelle eine .gitignore Datei mit folgendem Inhalt (falls noch nicht vorhanden):
   node_modules/
   dist/
   .DS_Store
   *.local
   .env

5. Passe in `.github/workflows/deploy.yml` den Wert von `VITE_BASE` auf den
   gewählten Repository-Namen an, z.B. VITE_BASE: /tim-budget-app/

6. Erstelle das GitHub-Repository mit `gh repo create` (mit dem gewählten Namen und
   der gewählten Sichtbarkeit), setze es als remote origin.

7. Stage alle Dateien, erstelle einen ersten Commit mit der Message:
   "Initial commit – Budget PWA v1.0"

8. Pushe auf den main-Branch.

9. Aktiviere GitHub Pages für dieses Repository mit der Source "GitHub Actions":
   gh api repos/{owner}/{repo}/pages --method POST \
     --field build_type=workflow \
     --field source='{"branch":"main","path":"/"}'
   (Falls das nicht klappt: öffne github.com/{owner}/{repo}/settings/pages
    und zeige mir die URL – ich aktiviere es manuell.)

10. Gib mir am Ende die GitHub Pages URL aus, unter der die App erreichbar sein wird:
    https://{github-username}.github.io/{repo-name}/

Bitte führe jeden Schritt aus und zeige mir was du tust.
```
