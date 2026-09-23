import { MERCHANT_WINDOWS } from "../config/shopConfig.js";
import { CONFIG } from "../config/gameConfig.js";

export class MerchantSystem {
  update(run) {
    const windowIndex = MERCHANT_WINDOWS.findIndex(
      ([start, end]) => run.time >= start && run.time < end,
    );
    if (windowIndex < 0) {
      run.merchant = null;
      return;
    }
    if (run.merchantWindow !== windowIndex) {
      run.merchantWindow = windowIndex;
      run.merchant = this.place(run, MERCHANT_WINDOWS[windowIndex][1]);
    }
    const merchant = run.merchant;
    if (!merchant) return;
    const distance = Math.hypot(
      run.player.x - merchant.x,
      run.player.z - merchant.z,
    );
    if (distance > 4) merchant.reentryLocked = false;
    if (distance < 2.4 && !merchant.reentryLocked && run.phase === "playing")
      run.phase = "merchant";
  }
  place(run, leavesAt) {
    const limit = CONFIG.mapHalf - 5;
    const clear = (x, z) =>
      run.props.every((p) => Math.hypot(p.x - x, p.z - z) > p.radius + 3);
    for (let attempt = 0; attempt < 80; attempt++) {
      const angle = run.random() * Math.PI * 2;
      const radius = 18 + run.random() * 12;
      const x = Math.max(
        -limit,
        Math.min(limit, run.player.x + Math.cos(angle) * radius),
      );
      const z = Math.max(
        -limit,
        Math.min(limit, run.player.z + Math.sin(angle) * radius),
      );
      if (Math.hypot(x - run.player.x, z - run.player.z) > 10 && clear(x, z))
        return { x, z, leavesAt, reentryLocked: false };
    }
    // Deterministic fallback guarantees a reachable clearing without changing props.
    for (let x = -limit; x <= limit; x += 5)
      for (let z = -limit; z <= limit; z += 5)
        if (clear(x, z)) return { x, z, leavesAt, reentryLocked: false };
    return null;
  }
}
