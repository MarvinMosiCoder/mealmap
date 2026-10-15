# Git workflow

Run these commands at the MealMap project root. They are instructions to run deliberately; creating this documentation does not commit, merge or push anything.

## Inspect changes

```powershell
git status --short
git diff
git remote -v
git branch --show-current
```

Review changes before staging. `.env.local`, `backend/.env`, dependencies, `.expo/` and `.preview/` are ignored. Example environment files should contain placeholders. Preserve both package lockfiles and the migration files with the code that needs them.

## Commit selected files

Stage explicit paths rather than unrelated work. For example, to stage the documentation:

```powershell
git add -- README.md docs
git diff --cached
git commit -m "Document MealMap setup and authentication"
```

Run the [project checks](troubleshooting.md#verification-commands) before committing application changes.

## Synchronize with a remote

If no remote exists, configure the URL of your MealMap repository:

```powershell
git remote add origin <your-MealMap-repository-URL>
```

Replace the placeholder before running. Check the existing remote first; do not copy Chartineer's remote into this project.

Fetch changes before deciding how to integrate them:

```powershell
git fetch origin
git log --oneline --graph --decorate -12
```

On a clean working tree, merge the corresponding remote branch if needed, replacing `<branch>` with the actual branch:

```powershell
git merge origin/<branch>
```

After reviewing and committing the result, push with `git push -u origin <branch>`. Follow the repository's branch policy; do not force-push to solve a routine rejected push. See the [Git merge reference](https://git-scm.com/docs/git-merge).

## Conflicts

Use `git status` and `git diff --name-only --diff-filter=U` to identify conflicts. Resolve the intended combined result, remove conflict markers, stage the resolved paths, run checks and complete the merge commit.

Preserve MealMap's public Home, guarded private tabs, AuthProvider and styling configuration when resolving navigation changes. Do not restore obsolete Chartineer routes or branding. If migrations conflict, check applied database history before renaming or rewriting files.
