import type { ConnectorInfo } from '../../shared/types.ts';
import { initials } from '../lib/ui.ts';

export function PlatformBadge({ c, size = 28 }: { c: Pick<ConnectorInfo, 'name' | 'color'>; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-lg font-mono font-semibold text-char"
      style={{ width: size, height: size, background: c.color, fontSize: size * 0.38 }}
    >
      {initials(c.name)}
    </span>
  );
}
