#!/usr/bin/env node
/**
 * Greasy Fork publish/sync for userscripts monorepo packages.
 *
 * Auth once:  pnpm greasyfork:login
 * First post: pnpm greasyfork:publish <package-dir>
 * Sync:       pnpm greasyfork:sync <package-dir>
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUTH_DIR = join(ROOT, '.greasyfork');
const AUTH_FILE = join(AUTH_DIR, 'storage-state.json');
const GF = 'https://greasyfork.org/en';
const GH_RAW =
  'https://raw.githubusercontent.com/pedro-mass/userscripts/main/packages';

const usage = `Usage:
  node scripts/greasyfork/publish.mjs login
  node scripts/greasyfork/publish.mjs publish <package> [--build] [--headed] [--write-script-id]
  node scripts/greasyfork/publish.mjs sync <package> [--headed]

Examples:
  pnpm greasyfork:login
  pnpm greasyfork:publish chesscom-lichess-export --build
  pnpm greasyfork:sync live-chart-filter

Package = folder name under packages/ (must contain greasyfork.json).`;

function die(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const [command, packageName, ...rest] = argv;
  const flags = {
    build: rest.includes('--build'),
    headed: rest.includes('--headed'),
    writeScriptId: rest.includes('--write-script-id'),
  };
  return { command, packageName, flags };
}

function packageDir(name) {
  const dir = join(ROOT, 'packages', name);
  if (!existsSync(dir)) die(`Unknown package: ${name} (${dir})`);
  return dir;
}

function loadGreasyforkConfig(pkgDir) {
  const path = join(pkgDir, 'greasyfork.json');
  if (!existsSync(path)) {
    die(`Missing ${path}. Add greasyfork.json (see docs/publishing.md).`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readDist(pkgDir, distFile) {
  const path = join(pkgDir, 'dist', distFile);
  if (!existsSync(path)) {
    die(`Missing built file: ${path}\nRun package build first or pass --build.`);
  }
  return readFileSync(path, 'utf8');
}

function parseUserscriptHeader(code) {
  const get = (key) => {
    const match = code.match(new RegExp(`// @${key}\\s+(.+)`, 'i'));
    return match?.[1]?.trim() ?? '';
  };
  return {
    name: get('name'),
    description: get('description'),
    version: get('version'),
  };
}

function syncUrl(packageName, distFile) {
  return `${GH_RAW}/${packageName}/dist/${distFile}`;
}

function additionalInfoSyncUrl(packageName, config) {
  if (!config.additionalInfo) return null;
  return `${GH_RAW}/${packageName}/${config.additionalInfo}`;
}

function runBuild(packageName) {
  const pkgJson = JSON.parse(
    readFileSync(join(ROOT, 'packages', packageName, 'package.json'), 'utf8'),
  );
  const filter = pkgJson.name;
  console.log(`Building ${filter}...`);
  const result = spawnSync('pnpm', ['--filter', filter, 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) die('Build failed.');
}

function readAdditionalInfo(pkgDir, config) {
  if (!config.additionalInfo) return '';
  const path = join(pkgDir, config.additionalInfo);
  if (!existsSync(path)) die(`Missing additional info file: ${path}`);
  return readFileSync(path, 'utf8').trim();
}

async function browserContext(headed) {
  if (!existsSync(AUTH_FILE)) {
    die(`No saved session at ${AUTH_FILE}\nRun: pnpm greasyfork:login`);
  }
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  return { browser, context };
}

async function assertSignedIn(page) {
  await page.goto(`${GF}/users/111366-pedro-mass`);
  const signedIn = await page
    .getByRole('link', { name: 'Sign out' })
    .isVisible()
    .catch(() => false);
  if (!signedIn) {
    die('Greasy Fork session expired. Run: pnpm greasyfork:login');
  }
}

async function cmdLogin() {
  mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${GF}/users/sign_in`);
  console.log('Sign in to Greasy Fork in the browser window...');
  await page.waitForFunction(
    () => document.body?.innerText?.includes('Sign out'),
    { timeout: 300_000 },
  );
  await context.storageState({ path: AUTH_FILE });
  console.log(`Saved session to ${AUTH_FILE}`);
  await browser.close();
}

async function configureSync(page, scriptId, codeUrl, infoUrl) {
  await page.goto(`${GF}/scripts/${scriptId}/admin`);
  await page.fill('#script_sync_identifier', codeUrl);
  await page.check('#script_sync_type_automatic');
  if (infoUrl) {
    const infoField = page.locator('input[name="additional_info_sync[0][sync_identifier]"]');
    if (await infoField.count()) {
      await infoField.fill(infoUrl);
      const md = page.locator('#additional_info_sync_0_value_markup_markdown');
      if (await md.count()) await md.check();
    }
  }
  await page.click('input[name="update-and-sync"]');
  await page.waitForURL((u) => u.pathname.includes(`/scripts/${scriptId}`), {
    timeout: 60_000,
  });
}

async function cmdPublish(packageName, flags) {
  const pkgDir = packageDir(packageName);
  const config = loadGreasyforkConfig(pkgDir);
  if (config.scriptId) {
    die(
      `scriptId ${config.scriptId} already set in greasyfork.json.\nUse: pnpm greasyfork:sync ${packageName}`,
    );
  }
  if (flags.build) runBuild(packageName);

  const code = readDist(pkgDir, config.distFile);
  const header = parseUserscriptHeader(code);
  const additionalInfo = readAdditionalInfo(pkgDir, config);
  const url = syncUrl(packageName, config.distFile);
  const infoUrl = additionalInfoSyncUrl(packageName, config);

  if (!header.name || !header.description) {
    die('Could not parse @name / @description from dist userscript header.');
  }

  console.log(`Publishing ${header.name} v${header.version}...`);
  console.log(`Sync URL: ${url}`);

  const { browser, context } = await browserContext(flags.headed);
  const page = await context.newPage();
  await assertSignedIn(page);

  await page.goto(`${GF}/script_versions/new`);
  await page.fill('#library-name', header.name);
  await page.fill('#library-description', header.description);
  await page.fill('#script_version_code', code);

  if (additionalInfo) {
    await page.check('#script_version_additional_info_0_value_markup_markdown');
    await page.fill('#script-version-additional-info-0', additionalInfo);
  }

  await page.click('input[name="commit"]');
  await page.waitForURL(/\/scripts\/\d+/, { timeout: 120_000 });

  const scriptId = Number(page.url().match(/\/scripts\/(\d+)/)?.[1]);
  if (!scriptId) die(`Could not parse script ID from ${page.url()}`);

  console.log(`Posted listing: ${page.url()}`);
  await configureSync(page, scriptId, url, infoUrl);

  const listingUrl = `${GF}/scripts/${scriptId}`;
  console.log(`Synced from GitHub. Listing: ${listingUrl}`);

  if (flags.writeScriptId) {
    const configPath = join(pkgDir, 'greasyfork.json');
    const next = { ...config, scriptId };
    writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`Wrote scriptId to ${configPath}`);
  } else {
    console.log(
      `Add to packages/${packageName}/greasyfork.json:\n  "scriptId": ${scriptId}`,
    );
    console.log('Or re-run with --write-script-id');
  }

  await browser.close();
}

async function cmdSync(packageName, flags) {
  const pkgDir = packageDir(packageName);
  const config = loadGreasyforkConfig(pkgDir);
  if (!config.scriptId) {
    die(
      `No scriptId in greasyfork.json.\nFirst publish: pnpm greasyfork:publish ${packageName} --build --write-script-id`,
    );
  }

  const url = syncUrl(packageName, config.distFile);
  const infoUrl = additionalInfoSyncUrl(packageName, config);
  console.log(`Syncing script ${config.scriptId} from ${url}...`);

  const { browser, context } = await browserContext(flags.headed);
  const page = await context.newPage();
  await assertSignedIn(page);
  await configureSync(page, config.scriptId, url, infoUrl);
  console.log(`Done: ${GF}/scripts/${config.scriptId}`);
  await browser.close();
}

async function main() {
  const { command, packageName, flags } = parseArgs(process.argv.slice(2));

  if (command === 'login') {
    await cmdLogin();
    return;
  }
  if (command === 'publish') {
    if (!packageName) die(usage);
    await cmdPublish(packageName, flags);
    return;
  }
  if (command === 'sync') {
    if (!packageName) die(usage);
    await cmdSync(packageName, flags);
    return;
  }

  die(usage);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
