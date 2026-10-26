import { describe, it, expect, beforeEach } from 'vitest';
import {
  INTELLIGENCE_CONFIG,
  COLE_DEBT_CONFIG,
  SOL_SYSTEM_ID,
} from '@game/constants.js';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  formatVisitInfo,
  formatSource,
  getKnownSystemsSortedByStaleness,
} from '../../src/features/info-broker/infoBrokerUtils.js';
import { InformationBroker } from '@game/game-information-broker.js';

describe('Orbit visit tracking constants', () => {
  it('should define ORBIT source identifier', () => {
    expect(INTELLIGENCE_CONFIG.SOURCES.ORBIT).toBe('orbit');
    expect(INTELLIGENCE_CONFIG.SOURCES.VISITED).toBe('visited');
    expect(INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER).toBe(
      'intelligence_broker'
    );
  });
});

describe('Cole early repayment constants', () => {
  it('should define early repayment fee rate', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE).toBe(0.1);
  });

  it('should define early repayment window in days', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS).toBe(20);
  });
});

describe('NavigationManager orbit tracking', () => {
  let game;
  let nav;

  beforeEach(() => {
    nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, nav);
    game.initNewGame();
  });

  it('should create orbit priceKnowledge entry on jump to unvisited system', () => {
    const connectedSystems = nav.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    const pkBefore = game.getPriceKnowledge();
    expect(pkBefore[targetSystem]).toBeUndefined();

    game.updateLocation(targetSystem);

    const pkAfter = game.getPriceKnowledge();
    expect(pkAfter[targetSystem]).toBeDefined();
    expect(pkAfter[targetSystem].source).toBe('orbit');
    expect(pkAfter[targetSystem].prices).toBeNull();
    expect(pkAfter[targetSystem].lastVisit).toBe(0);
  });

  it('should NOT overwrite existing priceKnowledge on jump', () => {
    const connectedSystems = nav.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    game.updateLocation(targetSystem);
    game.dock();
    const pkAfterDock = game.getPriceKnowledge();
    expect(pkAfterDock[targetSystem].source).toBe('visited');

    game.updateLocation(SOL_SYSTEM_ID);
    game.updateLocation(targetSystem);

    const pkAfterReturn = game.getPriceKnowledge();
    expect(pkAfterReturn[targetSystem].source).toBe('visited');
  });

  it('should NOT overwrite intelligence_broker data on jump', () => {
    const connectedSystems = nav.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    game.purchaseIntelligence(targetSystem);
    const pkAfterIntel = game.getPriceKnowledge();
    expect(pkAfterIntel[targetSystem].source).toBe('intelligence_broker');

    game.updateLocation(targetSystem);

    const pkAfterJump = game.getPriceKnowledge();
    expect(pkAfterJump[targetSystem].source).toBe('intelligence_broker');
  });
});

describe('Info Broker display for orbit-only entries', () => {
  it('formatVisitInfo should return "Visited but never docked" for orbit source', () => {
    expect(formatVisitInfo(5, 'orbit')).toBe('방문했지만 도킹한 적 없음');
    expect(formatVisitInfo(0, 'orbit')).toBe('방문했지만 도킹한 적 없음');
  });

  it('formatVisitInfo should behave normally for non-orbit sources', () => {
    expect(formatVisitInfo(null)).toBe('방문한 적 없음');
    expect(formatVisitInfo(0)).toBe('현재 가격');
    expect(formatVisitInfo(5)).toBe('마지막 방문: 5일 전');
    expect(formatVisitInfo(1)).toBe('마지막 방문: 1일 전');
  });

  it('formatSource should handle orbit source', () => {
    expect(formatSource('orbit')).toBe('궤도만 통과');
  });

  it('getIntelligenceCost should treat orbit-only as never-visited pricing', () => {
    const priceKnowledge = {
      5: { lastVisit: 3, prices: null, source: 'orbit' },
    };
    const cost = InformationBroker.getIntelligenceCost(5, priceKnowledge);
    expect(cost).toBe(100);
  });

  it('orbit-only entries should age normally via staleness increment', () => {
    const priceKnowledge = {
      5: { lastVisit: 0, prices: null, source: 'orbit' },
    };
    priceKnowledge[5].lastVisit += 1;
    expect(priceKnowledge[5].lastVisit).toBe(1);
    expect(formatVisitInfo(priceKnowledge[5].lastVisit, 'orbit')).toBe(
      '방문했지만 도킹한 적 없음'
    );
  });

  it('getKnownSystemsSortedByStaleness should exclude orbit-only entries (no prices)', () => {
    const starData = [
      { id: 0, name: 'Sol' },
      { id: 5, name: 'Wolf 359' },
    ];
    const priceKnowledge = {
      0: { lastVisit: 0, prices: { grain: 10 }, source: 'visited' },
      5: { lastVisit: 3, prices: null, source: 'orbit' },
    };
    const result = getKnownSystemsSortedByStaleness(priceKnowledge, starData);
    expect(result).toHaveLength(1);
    expect(result[0].system.id).toBe(0);
  });
});
