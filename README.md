# Noffle My Needs (demo)

A browser-only demo of **Noffle My Needs**, built by the team **A11y Allies** for the
[Trust In SODA](https://www.trustinsoda.com/) and [Code Institute](https://codeinstitute.net/)
Hackathon in September 2021.

[Try the live demo](https://abibubble.github.io/noffle-my-needs-demo/)

[See the original hackathon repository](https://github.com/Abibubble/noffle-my-needs)

This demo has been updated since the hackathon. See [Changes since the hackathon](#changes-since-the-hackathon).

## Contents

- [What it is](#what-it-is)
- [How to try it](#how-to-try-it)
- [Changes since the hackathon](#changes-since-the-hackathon)
- [Accessibility](#accessibility)
- [Run it locally](#run-it-locally)
- [Tests](#tests)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Credits](#credits)

## What it is

The hackathon theme was "Building An Accessible Workplace". The team built a tool that lets
everyone at work share what they need to do their best work that day.

**Noffle**
_noun_
A state of need of a particular person.
Usage: "I've set a 'Please speak up' Noffle on my work system so that everyone knows I may be
hard of hearing."

With Noffle My Needs you can:

- set your own Noffles, like "Please speak up" or "Working from home"
- see your colleagues' public Noffles on the Office page
- press a "Panic button" Noffle to show you need urgent help
- as an admin, add and delete Noffles, and manage users

## How to try it

- Open the [live demo](https://abibubble.github.io/noffle-my-needs-demo/).
- Go to **Choose a Demo Person** and pick one of the made-up colleagues.
- Choose **Alex Morgan** to try the admin pages (Manage Users and Manage Noffles).
- You can add your own demo person. No username or password is needed.
- To start again, use **Reset the demo** on the Choose a Demo Person page.

### Your data

- There are no real accounts and no passwords.
- Nothing is sent to a server. There isn't one.
- Anything you change is saved only in your own browser (`localStorage`).
- If your browser blocks storage, the demo still works, but it can't remember your changes.

## Changes since the hackathon

The original was a Flask app with a MongoDB database and real accounts. It was hosted on
Heroku, then Render, and both have since stopped. This demo was rebuilt so it can be hosted for
free on GitHub Pages, without holding anyone's passwords or personal data.

- It runs only in the browser. There's no server, database, accounts or passwords.
- Logging in and registering are replaced by choosing, or adding, a demo person.
- The sample colleagues and their Noffles are made up.
- The avatars are new, simple shapes. The originals were licensed images.
- Private Noffles are now only shown to admins and to the person who set them, as the original
  site described. This includes the panic button, so only admins see when someone needs urgent
  help.
- Bootstrap and Font Awesome are served from the site itself, so no third-party requests are
  made.
- The team's HTML and CSS were kept as close to the original as possible.

## Accessibility

The team built Noffle My Needs with accessibility in mind. In November 2026, this demo was
audited against [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level AA, the standard when it was
built, and every issue found was fixed.

The CSS changes are in the "Accessibility fixes" section at the end of `site/css/styles.css`,
so the team's original CSS above it is unchanged. Each fix has a test in
`tests/e2e/accessibility.spec.js`, and the site only deploys if they all pass.

| WCAG criterion | Problem | Fix |
| --- | --- | --- |
| 1.4.10 Reflow | At 400% zoom the fixed navbar and footer covered most of the screen, and the open menu ran off it | The footer sits at the end of the page. The navbar scrolls with the page, and only stays at the top on large screens |
| 1.4.12 Text Spacing | With wider text spacing, the hero text spilled out of its box | The box grows with its text |
| 2.4.2 Page Titled | Every page had the same title | Each page has its own title, like "Office \| Noffle My Needs demo" |
| 1.3.1 Info and Relationships, 2.4.6 Headings and Labels | The site name in the navbar was the h1 on every page, and some pages skipped heading levels | Each page's own heading is its h1, and heading levels don't skip |
| 2.4.1 Bypass Blocks | There was no quick way for keyboard users to get past the navbar | A "Skip to main content" link appears when you first press Tab |
| 3.3.2 Labels or Instructions | Form labels were hidden, so the placeholder was the only label, and it disappeared when you typed. Set My Noffles said you could choose private or public, but there was no way to | Every field has a visible label, and a hint where needed. The instructions match what the page does |
| 2.2.2 Pause, Stop, Hide | The avatars were in a carousel that moved every 5 seconds, and you typed the avatar's number | Every avatar shows at once with its name, as radio buttons |
| 4.1.1 Parsing, 1.3.1 Info and Relationships | On Manage Users, every "First Name" label pointed to the first user's field. On Profile, the "Private" checkboxes shared an id and didn't save anything | Every field has its own id. Profile says in text whether each Noffle is private |
| 1.3.5 Identify Input Purpose | Name fields didn't say what they were for | They use `autocomplete="given-name"` and `"family-name"` |
| 3.3.1 Error Identification, 3.3.3 Error Suggestion | Errors were the browser's own pop-ups. A Noffle name that already existed sent you to another page and lost what you'd typed | Errors show in text next to the field, say how to fix it, and keep what you typed |
| 4.1.2 Name, Role, Value | Office cards, "Delete Noffle", "Make user admin" and "Delete User" were links acting as buttons, so the Space key didn't work | They're real buttons. Links that go to another page are plain links |
| 2.4.3 Focus Order | The "Modify User" pop-up didn't move focus into it, and Escape didn't close it | It's a Bootstrap modal, like the Office pop-ups |
| 3.3.4 Error Prevention | "Delete Noffle" deleted straight away | Deleting a Noffle or a user asks you to confirm first |
| 1.4.1 Use of Colour | Links in text weren't underlined, so they looked like the text around them | Links are underlined |
| Best practice | Footer links opened a new tab without warning | They open in the same tab. The one link that opens a new tab says so |
| 1.1.1 Non-text Content | Office cards showed each person's Noffles as icons only, with no text. Decorative icons weren't hidden from screen readers | Each Noffle shows its name next to its icon. Decorative icons and avatars are hidden from screen readers. Cards grow to fit, instead of hiding content in a scroll box |
| 4.1.3 Status Messages, 2.4.3 Focus Order | Messages like "Noffle added" weren't announced, and the page reloaded after every change, so focus went back to the top | Setting a Noffle updates the card without reloading, keeps focus on it, and announces the change. After other changes, focus moves to the message |
| 1.4.1 Use of Colour | The panic button was only shown by a pale red card | Cards also show a "Needs urgent help" label (to admins and the person who pressed it) |
| 2.4.7 Focus Visible, 1.4.11 Non-text Contrast | Keyboard focus was faint on the navbar links and missing on the buttons and the menu button. Form field edges turned light grey on hover and focus | Everything you can tab to gets a 3px black outline with a white gap. Form field edges stay black |

## Run it locally

You need [nvm](https://github.com/nvm-sh/nvm) and [pnpm](https://pnpm.io/).

```bash
nvm use
pnpm install
pnpm start
```

Then open <http://localhost:4175>.

`pnpm install` also copies Bootstrap and Font Awesome into `site/vendor`.

## Tests

```bash
pnpm test
```

This runs:

| Command | What it checks |
| --- | --- |
| `pnpm test:unit` | The data logic in `site/js/store.js`, with Node's built-in test runner |
| `pnpm test:journeys` | User journeys in a real browser, with Playwright |
| `pnpm test:a11y` | Every page against WCAG 2.1 A and AA, with axe-core |

Playwright starts the site on port 4175 for you.

## Deployment

Every push to `main` runs the unit, user journey and accessibility tests. If they all pass, it
deploys the `site` folder to GitHub Pages, using `.github/workflows/deploy.yml`.

To set it up in a fork, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## Project structure

```text
site/                 The website that gets deployed
  *.html              One page for each page of the original site
  css/styles.css      The team's original CSS, with demo additions at the end
  js/data.js          The sample colleagues and Noffles
  js/store.js         The data logic (replaces the Flask routes in app.py)
  js/persist.js       Saving to the browser's storage
  js/layout.js        The navbar, banner, messages and footer
  js/pages/           One script for each page
  img/                The hero photo and avatars
scripts/              Copies Bootstrap and Font Awesome into site/vendor
tests/unit/           Unit tests
tests/e2e/            Playwright user journey and accessibility tests
```

## Credits

### The A11y Allies team

- [Abi Harrison-Nye](https://github.com/Abibubble)
- [Andrew Dempsey](https://github.com/andrewdempsey2018)
- [Carla Buongiorno](https://github.com/CarlaBuongiorno)
- [Henrique Peroni](https://github.com/Henriqueperoni)
- [Monika Hrda](https://github.com/monika-hrda)

Our team facilitator was [Megan Armstrong](https://www.linkedin.com/in/megan-armstrong4/).

Thank you to [Code Institute](https://codeinstitute.net/) and
[Trust In SODA](https://www.trustinsoda.com/) for running the hackathon.

### Media and code

- The hero photo is by [Fauxels on Pexels](https://www.pexels.com/@fauxels).
- [Bootstrap](https://getbootstrap.com/) for layout and components.
- [Font Awesome](https://fontawesome.com/) for icons.
