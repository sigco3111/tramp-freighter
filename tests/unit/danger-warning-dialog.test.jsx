import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DangerWarningDialog } from '../../src/features/danger/DangerWarningDialog';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Unit tests for DangerWarningDialog component
 *
 * Tests the DangerWarningDialog component in isolation,
 * focusing on rendering, user interactions, and data display.
 *
 * Feature: danger-system
 * Validates: Requirements 1.3, 12.1, 12.2, 12.3, 12.4, 12.5
 */
describe('DangerWarningDialog', () => {
  let game;
  let navigationSystem;

  beforeEach(() => {
    // Create NavigationSystem and GameCoordinator properly
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderDangerWarningDialog = (props = {}) => {
    const defaultProps = {
      destinationSystemId: 73, // 70 Ophiuchi A (dangerous)
      destinationSystemName: '70 Ophiuchi A',
      onProceed: vi.fn(),
      onCancel: vi.fn(),
      ...props,
    };

    return render(
      <GameProvider game={game}>
        <DangerWarningDialog {...defaultProps} />
      </GameProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render dialog with correct title and destination', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('점프 경고')).toBeInTheDocument();
      expect(screen.getByText('70 Ophiuchi A')).toBeInTheDocument();
      expect(screen.getByText('목적지')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderDangerWarningDialog();

      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render risk assessment section', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('위험 평가')).toBeInTheDocument();
      expect(screen.getByText('해적 조우')).toBeInTheDocument();
      expect(screen.getByText('세관 검문')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('위험을 감수하고 진행')).toBeInTheDocument();
      expect(screen.getByText('점프 취소')).toBeInTheDocument();
    });
  });

  describe('Danger Zone Classification Display', () => {
    it('should display "Dangerous" for dangerous systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 73, // 70 Ophiuchi A
        destinationSystemName: '70 Ophiuchi A',
      });

      expect(screen.getByText('위험')).toBeInTheDocument();
      expect(screen.getByText('보안 등급:')).toBeInTheDocument();
    });

    it('should display "Contested" for contested systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 7, // Sirius
        destinationSystemName: 'Sirius',
      });

      expect(screen.getByText('분쟁')).toBeInTheDocument();
    });

    it('should display zone description', () => {
      renderDangerWarningDialog();

      // Should show description for dangerous zone
      expect(
        screen.getByText(/해적 활동이 활발하고 법 집행이 부족한 변경 항성계/)
      ).toBeInTheDocument();
    });
  });

  describe('Risk Assessment Display', () => {
    it('should display pirate encounter probability as percentage', () => {
      renderDangerWarningDialog();

      // Should show percentage for pirate encounters
      const percentageElements = screen.getAllByText(/%$/);
      expect(percentageElements.length).toBeGreaterThanOrEqual(2); // At least pirate and inspection
    });

    it('should display inspection probability as percentage', () => {
      renderDangerWarningDialog();

      expect(
        screen.getByText('도착 시 세관 검문을 받을 확률')
      ).toBeInTheDocument();
    });

    it('should show risk factors when cargo is present', () => {
      // Add cargo to trigger risk factors
      const state = game.getState();
      state.ship.cargo.push({
        type: 'electronics',
        quantity: 10,
        purchasePrice: 100,
        purchaseSystem: 4,
        purchaseDate: 0,
      });

      renderDangerWarningDialog();

      expect(screen.getByText('위험 보정 요인')).toBeInTheDocument();
      expect(
        screen.getByText('화물 가치가 해적 조우 확률에 영향을 줍니다')
      ).toBeInTheDocument();
    });

    it('should show engine condition risk factor when engine is damaged', () => {
      // Damage engine to trigger risk factor
      game.updateShipCondition(100, 40, 100); // Engine at 40%

      renderDangerWarningDialog();

      expect(screen.getByText('위험 보정 요인')).toBeInTheDocument();
      expect(
        screen.getByText('엔진 상태가 나쁘면 해적 위험이 커집니다')
      ).toBeInTheDocument();
    });

    it('should show advanced sensors benefit when installed', () => {
      // Add advanced sensors upgrade
      const state = game.getState();
      state.ship.upgrades.push('advanced_sensors');

      renderDangerWarningDialog();

      expect(screen.getByText('위험 보정 요인')).toBeInTheDocument();
      expect(
        screen.getByText('고급 센서는 해적 탐지 확률을 낮춥니다')
      ).toBeInTheDocument();
    });
  });

  describe('안전 권고', () => {
    it('should show safety recommendations for dangerous systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        destinationSystemName: '70 Ophiuchi A',
      });

      expect(screen.getByText('안전 권고')).toBeInTheDocument();
      expect(
        screen.getByText('위험 지대 - 해적 활동이 활발할 것으로 예상됩니다')
      ).toBeInTheDocument();
      expect(
        screen.getByText('함선 시스템 상태를 양호하게 유지하세요')
      ).toBeInTheDocument();
    });

    it('should show different recommendations for contested systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 7, // Contested system
        destinationSystemName: 'Sirius',
      });

      expect(screen.getByText('안전 권고')).toBeInTheDocument();
      expect(
        screen.getByText('분쟁 지대 - 조우 위험이 중간 수준입니다')
      ).toBeInTheDocument();
    });

    it('should show general recommendations for all dangerous zones', () => {
      renderDangerWarningDialog();

      expect(
        screen.getByText('화물 가치와 위험 감수 수준을 비교해 보세요')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          '더 안전한 항성계를 거치는 대체 경로가 있을 수 있습니다'
        )
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onProceed when "Accept Risk & Proceed" is clicked', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        destinationSystemName: '70 Ophiuchi A',
        onProceed: mockOnProceed,
      });

      const proceedButton = screen.getByText('위험을 감수하고 진행');
      fireEvent.click(proceedButton);

      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when "Cancel Jump" is clicked', () => {
      const mockOnCancel = vi.fn();
      renderDangerWarningDialog({ onCancel: mockOnCancel });

      const cancelButton = screen.getByText('점프 취소');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button (×) is clicked', () => {
      const mockOnCancel = vi.fn();
      renderDangerWarningDialog({ onCancel: mockOnCancel });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should proceed directly for contested systems without confirmation', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 7, // Contested system
        destinationSystemName: 'Sirius',
        onProceed: mockOnProceed,
      });

      const proceedButton = screen.getByText('진행');
      fireEvent.click(proceedButton);

      // Should call onProceed directly without confirmation
      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should handle confirmation dialog interactions', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        onProceed: mockOnProceed,
      });

      // Click proceed button - should call onProceed directly
      const proceedButton = screen.getByText('위험을 감수하고 진행');
      fireEvent.click(proceedButton);

      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Handling', () => {
    it('should handle null faction data gracefully', () => {
      // Corrupt faction data
      const state = game.getState();
      state.player.factions = null;

      // Should not crash
      expect(() => {
        renderDangerWarningDialog();
      }).not.toThrow();

      expect(screen.getByText('점프 경고')).toBeInTheDocument();
    });

    it('should handle missing ship condition data gracefully', () => {
      // Should not crash with default ship condition
      expect(() => {
        renderDangerWarningDialog();
      }).not.toThrow();

      expect(screen.getByText('점프 경고')).toBeInTheDocument();
    });

    it('should handle empty cargo array', () => {
      // Ensure cargo is empty
      const state = game.getState();
      state.ship.cargo = [];

      renderDangerWarningDialog();

      // Should not show cargo risk factor
      expect(
        screen.queryByText('화물 가치가 해적 조우 확률에 영향을 줍니다')
      ).not.toBeInTheDocument();
    });

    it('should handle missing upgrades array', () => {
      // Remove upgrades
      const state = game.getState();
      state.ship.upgrades = [];

      renderDangerWarningDialog();

      // Should not show advanced sensors benefit
      expect(
        screen.queryByText('고급 센서는 해적 탐지 확률을 낮춥니다')
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', () => {
      renderDangerWarningDialog();

      // Should have dialog container with proper ID
      const dialog = document.getElementById('danger-warning-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('visible');
    });

    it('should have proper heading hierarchy', () => {
      renderDangerWarningDialog();

      // Should have h2 for main title
      const mainTitle = screen.getByRole('heading', { level: 2 });
      expect(mainTitle).toHaveTextContent('점프 경고');

      // Should have h3 for sections
      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have focusable buttons', () => {
      renderDangerWarningDialog();

      const proceedButton = screen.getByText('위험을 감수하고 진행');
      const cancelButton = screen.getByText('점프 취소');
      const closeButton = screen.getByText('×');

      expect(proceedButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
      expect(closeButton).not.toBeDisabled();
    });
  });
});
