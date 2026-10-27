// Hits every connector with its real example account and reports what came back.
// Usage: npm run check:connectors            (all)
//        npm run check:connectors github npm (some)
import 'dotenv/config';
import { connectors, fetchProfile } from '../server/connectors/index.ts';

const only = process.argv.slice(2);
const list = only.length ? connectors.filter((c) => only.includes(c.id)) : connectors;

let failed = 0;
const results = await Promise.all(
  list.map(async (c) => {
    if (c.requiresEnv && !process.env[c.requiresEnv]) return { c, status: 'SKIP', detail: `needs ${c.requiresEnv}` };
    const t = Date.now();
    try {
      const p = await fetchProfile(c.id, c.example);
      const ok = p.stats.length > 0 && p.displayName;
      if (!ok) failed++;
      return {
        c,
        status: ok ? 'PASS' : 'EMPTY',
        detail: `${Date.now() - t}ms  ${p.displayName} · ${p.stats.map((s) => `${s.label}=${s.value}`).join(', ')} · ${p.facts.length} facts`,
      };
    } catch (e: any) {
      failed++;
      return { c, status: 'FAIL', detail: `${Date.now() - t}ms  ${e?.message || e}` };
    }
  }),
);

for (const r of results) console.log(`${r.status.padEnd(5)} ${r.c.id.padEnd(14)} ${r.detail}`);
console.log(`\n${results.length - failed}/${results.length} connectors OK`);
process.exit(failed ? 1 : 0);
