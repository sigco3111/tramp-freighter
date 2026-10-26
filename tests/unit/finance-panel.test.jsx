import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancePanel } from '../../src/features/finance/FinancePanel.jsx';

const mockGetDebtInfo = vi.fn();
const mockBorrowFromCole = vi.fn();
const mockMakeDebtPayment = vi.fn();

vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn(),
}));

vi.mock('../../src/hooks/useGameAction.js', () => ({
  useGameAction: vi.fn(() => ({
    getDebtInfo: mockGetDebtInfo,
    borrowFromCole: mockBorrowFromCole,
    makeDebtPayment: mockMakeDebtPayment,
  })),
}));

const { useGameEvent } = await import('../../src/hooks/useGameEvent.js');

function makeDebtInfo(overrides = {}) {
  return {
    debt: 2000,
    lienRate: 0.05,
    interestRate: 0.03,
    nextInterestDay: 45,
    maxDraw: 500,
    availableDrawTiers: [100, 250, 500],
    ...overrides,
  };
}

function setDefaultHookValues({ debt = 2000, credits = 5000 } = {}) {
  useGameEvent.mockImplementation((eventName) => {
    switch (eventName) {
      case 'debtChanged':
        return debt;
      case 'creditsChanged':
        return credits;
      case 'financeChanged':
        return { heat: 10 };
      case 'timeChanged':
        return 15;
      default:
        return undefined;
    }
  });
}

describe('FinancePanel', () => {
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultHookValues();
    mockGetDebtInfo.mockReturnValue(makeDebtInfo());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('returns null when debtInfo is null (debt undefined)', () => {
    useGameEvent.mockImplementation((eventName) => {
      switch (eventName) {
        case 'debtChanged':
          return undefined;
        case 'creditsChanged':
          return 5000;
        case 'financeChanged':
          return { heat: 10 };
        case 'timeChanged':
          return 15;
        default:
          return undefined;
      }
    });

    const { container } = render(<FinancePanel onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when finance is falsy', () => {
    useGameEvent.mockImplementation((eventName) => {
      switch (eventName) {
        case 'debtChanged':
          return 2000;
        case 'creditsChanged':
          return 5000;
        case 'financeChanged':
          return null;
        case 'timeChanged':
          return 15;
        default:
          return undefined;
      }
    });

    const { container } = render(<FinancePanel onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when credits is undefined', () => {
    useGameEvent.mockImplementation((eventName) => {
      switch (eventName) {
        case 'debtChanged':
          return 2000;
        case 'creditsChanged':
          return undefined;
        case 'financeChanged':
          return { heat: 10 };
        case 'timeChanged':
          return 15;
        default:
          return undefined;
      }
    });

    const { container } = render(<FinancePanel onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders debt overview with correct values', () => {
    render(<FinancePanel onClose={vi.fn()} />);

    expect(screen.getByText('콜 신용 한도')).toBeTruthy();
    expect(screen.getByText('부채 개요')).toBeTruthy();
    expect(screen.getByText('5% (거래 매출 기준)')).toBeTruthy();
    expect(screen.getByText('3% / 30 일마다')).toBeTruthy();
    // nextInterestDay 45, currentDay 15 => 30일
    expect(screen.getByText('30일')).toBeTruthy();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(<FinancePanel onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders payment buttons and disables when credits insufficient', () => {
    setDefaultHookValues({ credits: 50 });

    render(<FinancePanel onClose={vi.fn()} />);

    expect(screen.getByText('상환하기')).toBeTruthy();

    const payButtons = screen.getAllByRole('button', { name: /^₡\d+ 지불/ });
    // 3 tier buttons + 1 Pay All = 4
    const tierButtons = payButtons.filter(
      (btn) => !btn.textContent.includes('전액 상환')
    );
    tierButtons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('clicking a payment button calls makeDebtPayment and shows success message', () => {
    mockMakeDebtPayment.mockReturnValue({ success: true, amount: 500 });

    render(<FinancePanel onClose={vi.fn()} />);

    const pay500 = screen.getByRole('button', { name: /^₡500 지불$/ });
    fireEvent.click(pay500);

    expect(mockMakeDebtPayment).toHaveBeenCalledWith(500);
    expect(screen.getByText('빚 상환에 ₡500 지불')).toBeTruthy();
  });

  it('shows error message on failed payment', () => {
    mockMakeDebtPayment.mockReturnValue({
      success: false,
      reason: 'Insufficient credits',
    });

    render(<FinancePanel onClose={vi.fn()} />);

    const pay500 = screen.getByRole('button', { name: /^₡500 지불$/ });
    fireEvent.click(pay500);

    expect(screen.getByText('Insufficient credits')).toBeTruthy();
  });

  it('borrow buttons call borrowFromCole and show success message', () => {
    mockBorrowFromCole.mockReturnValue({ success: true });

    render(<FinancePanel onClose={vi.fn()} />);

    const borrowBtn = screen.getByRole('button', { name: /^₡250 차입$/ });
    fireEvent.click(borrowBtn);

    expect(mockBorrowFromCole).toHaveBeenCalledWith(250);
    expect(screen.getByText('콜에게서 ₡250 차입')).toBeTruthy();
  });

  it('shows error message on failed borrow', () => {
    mockBorrowFromCole.mockReturnValue({
      success: false,
      reason: 'Maximum credit exceeded',
    });

    render(<FinancePanel onClose={vi.fn()} />);

    const borrowBtn = screen.getByRole('button', { name: /^₡100 차입$/ });
    fireEvent.click(borrowBtn);

    expect(screen.getByText('Maximum credit exceeded')).toBeTruthy();
  });

  it('Pay All button works correctly', () => {
    // credits=5000, debt=2000 => payAll pays min(5000,2000) = 2000
    mockMakeDebtPayment.mockReturnValue({ success: true, amount: 2000 });

    render(<FinancePanel onClose={vi.fn()} />);

    const payAllBtn = screen.getByRole('button', { name: /^전액 상환/ });
    expect(payAllBtn.textContent).toContain('2,000');

    fireEvent.click(payAllBtn);
    expect(mockMakeDebtPayment).toHaveBeenCalledWith(2000);
  });

  it('shows debt paid in full message when payment equals total debt', () => {
    mockMakeDebtPayment.mockReturnValue({ success: true, amount: 2000 });

    render(<FinancePanel onClose={vi.fn()} />);

    const payAllBtn = screen.getByRole('button', { name: /^전액 상환/ });
    fireEvent.click(payAllBtn);

    expect(screen.getByText('빚을 모두 갚았습니다!')).toBeTruthy();
  });

  it('does not render payment section when debt is 0', () => {
    mockGetDebtInfo.mockReturnValue(makeDebtInfo({ debt: 0 }));
    setDefaultHookValues({ debt: 0 });

    render(<FinancePanel onClose={vi.fn()} />);

    expect(screen.queryByText('상환하기')).toBeNull();
    expect(screen.getByText('긴급 대출')).toBeTruthy();
  });

  it('shows next interest as N/A when debt is 0', () => {
    mockGetDebtInfo.mockReturnValue(makeDebtInfo({ debt: 0 }));
    setDefaultHookValues({ debt: 0 });

    render(<FinancePanel onClose={vi.fn()} />);

    expect(screen.getByText('N/A')).toBeTruthy();
  });
});
