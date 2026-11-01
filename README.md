# SplitBook

Split shared bills with friends: groups, four ways to split (equally, exact amounts, percentages, shares), simplified settle-ups and monthly spend charts.

- Live site: https://arnab2592000-source.github.io/splitbook/
- Data syncs through Firebase Firestore (project `splitbook-959ce`).
- Each group has a secret link (`#g=<id>`). Anyone with the link can view and add expenses; groups can't be listed or browsed.
- If Firebase can't be reached, the page falls back to saving in the browser.

Everything is in `index.html`; no build step.
