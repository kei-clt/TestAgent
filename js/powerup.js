/**
 * powerup.js
 * Defines fixed power-up positions and management.
 *
 * Power-up types:
 *  'speed'  – 2x speed for 5s
 *  'freeze' – freeze opponent for 3s
 *  'bonus'  – drop 5 new letters on the map
 */

const PowerupModule = (() => {

  const TYPES = ['speed', 'freeze', 'bonus'];
  const ICONS = { speed: '⚡', freeze: '❄', bonus: '★' };
  const COLORS = { speed: '#fb923c', freeze: '#67e8f9', bonus: '#facc15' };
  const RESPAWN_MS = 20000;

  // Fixed symmetric positions on path tiles (verified against TEMPLATE)
  const FIXED_POSITIONS = [
    { r: 3,  c: 3,  type: 'speed'  },
    { r: 3,  c: 17, type: 'speed'  },
    { r: 10, c: 10, type: 'bonus'  },
    { r: 17, c: 3,  type: 'freeze' },
    { r: 17, c: 17, type: 'freeze' },
  ];

  /**
   * Create initial powerup list.
   * Each entry: { r, c, type, active:true, respawnAt:null }
   */
  function initPowerups() {
    return FIXED_POSITIONS.map(p => ({
      r: p.r, c: p.c, type: p.type,
      active: true,
      respawnAt: null
    }));
  }

  /**
   * Check respawns; call each frame with current timestamp.
   */
  function tick(powerups, now) {
    for (const pu of powerups) {
      if (!pu.active && pu.respawnAt && now >= pu.respawnAt) {
        pu.active = true;
        pu.respawnAt = null;
      }
    }
  }

  /**
   * Collect a power-up at (r,c). Returns the power-up object or null.
   */
  function collect(powerups, r, c, now) {
    for (const pu of powerups) {
      if (pu.active && pu.r === r && pu.c === c) {
        pu.active = false;
        pu.respawnAt = now + RESPAWN_MS;
        return pu;
      }
    }
    return null;
  }

  return { TYPES, ICONS, COLORS, RESPAWN_MS, initPowerups, tick, collect };
})();
