import type { VersionCheckResult } from '../types/update';
export type { VersionCheckResult } from '../types/update';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

export class UpdateChecker {
  static async checkVersionWithResult(): Promise<VersionCheckResult> {
    try {
      const res = await fetch('https://api.github.com/repos/Boda335/forgecord/tags');
      if (!res.ok) {
        return { success: false, error: 'Failed to fetch tags' };
      }

      const json = (await res.json()) as Array<{ name?: string }>;
      const versions = (Array.isArray(json) ? json : [])
        .map(tag => {
          const name = typeof tag.name === 'string' ? tag.name : '';
          const match = name.match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
          return match ? { name, parts: match.slice(1, 4).map(Number) } : null;
        })
        .filter((tag): tag is { name: string; parts: number[] } => Boolean(tag));
      if (!versions.length) return { success: false, error: 'No semantic version tags found' };
      const latestTag = versions.sort((a, b) => {
        for (let i = 0; i < 3; i += 1) if (a.parts[i] !== b.parts[i]) return b.parts[i] - a.parts[i];
        return 0;
      })[0];
      const latestName = latestTag.name.replace(/^v/, '');
      const latest = latestTag.parts;
      const current = String(pkg.version).replace(/^v/, '').split('.').map(Number);

      const updateAvailable =
        latest[0] > current[0] ||
        (latest[0] === current[0] && latest[1] > current[1]) ||
        (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]);

      return {
        success: true,
        latest: latestName,
        current: pkg.version,
        updateAvailable,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
