/**
 * @fileoverview Integration tests for RepairPanel free repair functionality
 *
 * Tests the integration between RepairPanel UI and GameCoordinator free repair methods.
 * Verifies that free repair options appear when available and function correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { SHIP_CONFIG } from '../../src/game/constants.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

describe('RepairPanel Free Repair Integration', () => {
  let game;
  let mockOnClose;

  beforeEach(() => {
    // Create fresh GameCoordinator instance
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Mock onClose function
    mockOnClose = vi.fn();

    // Set up test scenario: player at Sol with damaged hull
    const state = game.getState();
    state.player.currentSystem = 0; // Sol
    state.ship.hull = 70; // 30% hull damage

    // Set up Marcus Cole (at Sol) with Trusted reputation for free repair
    const marcusId = 'cole_sol';
    const marcusState = game.getNPCState(marcusId);
    marcusState.rep = 65; // Trusted tier
    marcusState.lastFreeRepairDay = null; // No previous free repair
  });

  const renderRepairPanel = () => {
    return render(
      <GameProvider game={game}>
        <RepairPanel onClose={mockOnClose} />
      </GameProvider>
    );
  };

  it('should display free repair option when NPC at Trusted tier is available', () => {
    renderRepairPanel();

    // Should show free repair section
    expect(screen.getByText('무료 수리')).toBeInTheDocument();

    // Should show Marcus Cole as available for free repair
    expect(screen.getByText('마커스 콜 (고리대금업자)')).toBeInTheDocument();

    // Should show repair limit for Trusted tier
    expect(
      screen.getByText('신뢰 등급:', { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText('최대 10% 선체 피해 수리', { exact: false })
    ).toBeInTheDocument();

    // Should show once per visit limitation
    expect(screen.getByText('방문당 1회 제한')).toBeInTheDocument();

    // Should show actual repair amount (10% since hull is at 70%)
    expect(
      screen.getByText((content, element) => {
        return (
          element &&
          element.className === 'repair-amount' &&
          element.textContent &&
          element.textContent.includes('수리 내용:') && element.textContent.includes('10.0%') && element.textContent.includes('선체 피해')
        );
      })
    ).toBeInTheDocument();

    // Should have enabled free repair button
    const freeRepairButton = screen.getByText('무료 수리 받기');
    expect(freeRepairButton).toBeInTheDocument();
    expect(freeRepairButton).not.toBeDisabled();
  });

  it('should not display free repair section when no NPCs are available', () => {
    // Set Marcus Cole to Cold reputation (no free repair)
    const marcusState = game.getNPCState('cole_sol');
    marcusState.rep = -20; // Cold tier

    renderRepairPanel();

    // Should show free repair section but with validation info
    expect(screen.getByText('무료 수리')).toBeInTheDocument();

    // Should show requirements not met
    expect(screen.getByText('무료 수리 조건')).toBeInTheDocument();
    expect(screen.getByText('마커스 콜')).toBeInTheDocument();
  });

  it('should apply free repair when button is clicked', () => {
    renderRepairPanel();

    const freeRepairButton = screen.getByText('무료 수리 받기');

    // Click the free repair button
    fireEvent.click(freeRepairButton);

    // Should show success message
    expect(screen.getByText(/무료 수리 완료:/)).toBeInTheDocument();

    // Hull should be repaired by 10% (from 70% to 80%)
    const state = game.getState();
    expect(state.ship.hull).toBe(80);

    // Marcus Cole's lastFreeRepairDay should be set
    const marcusState = game.getNPCState('cole_sol');
    expect(marcusState.lastFreeRepairDay).toBe(state.player.daysElapsed);
  });

  it('should disable free repair button when no hull damage exists', () => {
    // Set hull to maximum condition
    const state = game.getState();
    state.ship.hull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;

    renderRepairPanel();

    // Should show "수리할 선체 피해 없음"
    expect(screen.getByText('수리할 선체 피해 없음')).toBeInTheDocument();

    // Free repair button should be disabled
    const freeRepairButton = screen.getByText('무료 수리 받기');
    expect(freeRepairButton).toBeDisabled();
  });

  it('should show higher repair limit for Family tier NPC', () => {
    // Set Marcus Cole to Family reputation
    const marcusState = game.getNPCState('cole_sol');
    marcusState.rep = 95; // Family tier

    renderRepairPanel();

    // Should show Family tier repair limit
    expect(
      screen.getByText('가족 등급:', { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText('최대 25% 선체 피해 수리', { exact: false })
    ).toBeInTheDocument();
  });

  it('should not show free repair option when already used today', () => {
    // Set Marcus Cole as having used free repair today
    const state = game.getState();
    const marcusState = game.getNPCState('cole_sol');
    marcusState.lastFreeRepairDay = state.player.daysElapsed;

    renderRepairPanel();

    // Should show free repair section but with validation info
    expect(screen.getByText('무료 수리')).toBeInTheDocument();

    // Should show requirements not met
    expect(screen.getByText('무료 수리 조건')).toBeInTheDocument();
    expect(screen.getByText('마커스 콜')).toBeInTheDocument();
  });
});
