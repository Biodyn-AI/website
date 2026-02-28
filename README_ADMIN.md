# Biodyn Website Admin Dashboard

The admin dashboard lives at:

- `admin.html`

It edits and publishes:

- `content/site-data.json`

## What You Can Edit

- Active research projects (`projects` array)
- Articles / research outputs / blog posts (`articles` array)

## How To Use

1. Open `admin.html` in your browser.
2. Add, edit, reorder, or delete projects and articles.
3. Optional: click **Download JSON Backup** to save a local backup.
4. Add a GitHub Personal Access Token in the token field.
5. Click **Publish to GitHub**.

## Token Requirements

Use a fine-grained token (recommended) or classic PAT with access to this repo:

- Repository: `Biodyn-AI/website`
- Permission: **Contents: Read and write**

The token is not written to disk by the dashboard.

## Deployment Notes

This is a static GitHub Pages site, so no backend is required.
Publishing updates commits directly to `content/site-data.json` via the GitHub Contents API.
