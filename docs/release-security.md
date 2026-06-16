# Release Security

This package publishes through npm trusted publishing from GitHub Actions. The
workflow is designed so untrusted pull request execution and dependency caches
cannot be reused by the npm publishing job.

## Workflow Model

- Pull request workflows use `pull_request`, never `pull_request_target`.
- GitHub Actions are pinned to full commit SHAs instead of mutable version tags.
- The release workflow does not use dependency caching.
- `version-pr` can write the Changesets version PR, but it has no `id-token`
  permission.
- `build-package` installs dependencies and creates the npm tarball, but it has
  no `id-token` permission and does not persist checkout credentials.
- `publish` is the only job with `id-token: write`. It runs in the `npm`
  environment, does not checkout the repository, does not install package
  dependencies, and does not run package scripts. It only downloads the tarball
  produced by the same workflow run and calls `npm publish --provenance`.
- `github-release` can write release metadata after npm publishing, but it has no
  `id-token` permission and does not checkout code or install dependencies.

## Required Settings

Configure npm trusted publishing for:

- Publisher: GitHub Actions
- Organization or user: `proyecto-viviana`
- Repository: `solidjs-maplibre`
- Workflow filename: `release.yml`
- Environment name: `npm`
- Allowed actions: `npm publish`

Create a GitHub environment named `npm` and restrict deployments to `main`.
Required reviewers can be added there if releases should require a manual gate.

For repository protection, require pull requests for changes to `.github/**`.
If the org has a stable owners team, add a CODEOWNERS entry for
`.github/workflows/**` and require code-owner review in branch protection.
