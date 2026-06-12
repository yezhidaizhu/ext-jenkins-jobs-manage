# Jenkins Jobs Manage

A browser side panel extension built with WXT, Vue 3, and TypeScript for viewing and managing Jenkins jobs directly from the browser.

## Features

- Jenkins connection settings: save Jenkins Host, User Name, and API Token.
- Job list: fetch jobs from `/view/All/api/json` and display job name, link, and status.
- Status mapping: supports success, failed, unstable, not built, disabled, aborted, building, and unknown states.
- Queue detection: fetches `/queue/api/json` to prevent triggering duplicate builds for queued jobs.
- Trigger builds: supports regular jobs and parameterized jobs by calling `/build` or `/buildWithParameters`.
- Stop builds: gets the latest build number for a running job and calls `/stop`.
- Auto refresh: refreshes the job list every 10 seconds.
- Manual actions: refresh jobs, open Jenkins, and open settings.
- Action confirmation: build and stop actions require confirmation before execution.
- Toast notifications: shows success, failure, and configuration messages.

## Tech Stack

- WXT
- Vue 3
- TypeScript
- Vue Router
- Tailwind CSS
- Lucide Vue
- pnpm

## Permissions

The extension uses these permissions:

- `storage`: stores Jenkins connection settings in local extension storage.
- `<all_urls>`: allows requests to the configured Jenkins host.

## Jenkins Requirements

You need:

- Jenkins Host, for example `https://jenkins.example.com`
- Jenkins User Name
- Jenkins API Token

The Jenkins Host must start with `http://` or `https://`. Trailing slashes are removed automatically when saving the setting.

## Development

Install dependencies:

```bash
pnpm install
```

Start Chrome development mode:

```bash
pnpm dev
```

Start Firefox development mode:

```bash
pnpm dev:firefox
```

Run type checking:

```bash
pnpm compile
```

Build the extension:

```bash
pnpm build
```

Create a zip package:

```bash
pnpm zip
```

## Project Structure

```text
entrypoints/
  background.ts            # Browser extension background entry
  sidepanel/               # Side panel entry
src/
  components/              # Shared components
  composables/             # Jenkins API, settings, status, and toast logic
  pages/                   # Jobs page and settings page
  router/                  # Page routes
  types/                   # Type definitions
wxt.config.ts              # WXT config and extension manifest
```

## Core Flow

1. When the side panel opens, incomplete Jenkins settings redirect the user to the settings page.
2. After saving settings, the extension opens the job list page.
3. The job list page fetches Jenkins jobs and queue information, then merges them for display.
4. Build and stop actions show a confirmation area before execution.
5. After a successful action, the job list refreshes shortly after.

## Notes

- The API Token is stored in the browser extension's local storage.
- The extension currently reads only the Jenkins `All` view.
- Parameterized jobs call `buildWithParameters`, but there is no UI for editing build parameters yet.
- Job names are currently inserted into `/job/{name}` paths directly. Jobs with special characters may require additional URL encoding support.
