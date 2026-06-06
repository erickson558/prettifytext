# /push-github — GitHub Release Skill

Push the current state of PrettifyText to GitHub (`erickson558/prettifytext`) and
create a versioned release.

## Steps this skill performs

1. Read the current version from `VERSION`
2. Prompt for a release note (or auto-generate from last commits)
3. Stage all changed files
4. Commit with message: `chore(release): bump version to V{version}`
5. Tag the commit: `git tag V{version}`
6. Push branch + tags to `origin main`
7. Confirm GitHub Actions will create the release automatically

## Usage

Just type `/push-github` in Claude Code. Claude will:
- Check `git status`
- Summarise what changed
- Ask to confirm before pushing
- Execute the push and report the result

## GitHub account

- Account: `erickson558`
- Auth: GitHub CLI (`gh`) — already logged in via keyring
- Remote: `https://github.com/erickson558/prettifytext`
- Protocol: HTTPS (token in keyring)

## Manual commands (for reference)

```bash
# 1. Check status
git status

# 2. Stage all
git add -A

# 3. Commit
git commit -m "chore(release): bump version to V$(cat VERSION)"

# 4. Tag
git tag "V$(cat VERSION)"

# 5. Push branch + tag
git push origin main --tags

# 6. Verify release was created by Actions
gh release list --repo erickson558/prettifytext
```

## First-time setup (if remote not yet configured)

```bash
# Create repo on GitHub
gh repo create erickson558/prettifytext --public --source=. --remote=origin --push

# Or add remote manually
git remote add origin https://github.com/erickson558/prettifytext.git
git branch -M main
git push -u origin main
```
