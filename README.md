# Virello Store

These are the separated files from the supplied Virello Store HTML prototype:

- `index.html` — the website structure and Admin Login UI.
- `app.css` — the CSS that was originally inside the HTML `<style>` block.
- `app.js` — the JavaScript that was originally inside the HTML `<script>` block.
- `package.json` — basic Node/Express package configuration.

## Run the frontend

If you only want to open the site locally, open `index.html` in a browser.

For a Node/Express project, place these files in the project and serve the folder containing `index.html` as your public directory.

## Important

The supplied source is a browser-only prototype. Its current JavaScript uses `localStorage` for state and contains demo authentication. It does not by itself provide a secure production backend or central database.

The source itself states that production should replace the browser storage/authentication with API calls to a real backend/database.
