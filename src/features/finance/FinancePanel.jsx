import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { COLE_DEBT_CONFIG, EVENT_NAMES } from '../../game/constants';

/**
 * FinancePanel - React component for Cole's credit line
 *
 * Displays current debt overview, allows voluntary payments,
 * and provides emergency borrowing. Uses the Bridge Pattern to
 * subscribe to debt, credit, finance, and time changes.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function FinancePanel({ onClose }) {
  const debt = useGameEvent(EVENT_NAMES.DEBT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const finance = useGameEvent(EVENT_NAMES.FINANCE_CHANGED);
  const currentDay = useGameEvent(EVENT_NAMES.TIME_CHANGED);

  const { getDebtInfo, borrowFromCole, makeDebtPayment } = useGameAction();

  const [message, setMessage] = useState(null);

  const debtInfo =
    debt === undefined || !finance || credits === undefined
      ? null
      : getDebtInfo();

  if (!debtInfo) return null;

  const handleBorrow = (amount) => {
    const result = borrowFromCole(amount);
    if (result.success) {
      setMessage({ type: 'info', text: `콜에게서 ₡${amount} 차입` });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const handlePayment = (amount) => {
    const result = makeDebtPayment(amount);
    if (result.success) {
      const feeText = result.fee > 0 ? ` (+ 수수료 ₡${result.fee})` : '';
      setMessage({
        type: 'info',
        text:
          result.amount === debt
            ? '빚을 모두 갚았습니다!'
            : `빚 상환에 ₡${result.amount}${feeText} 지불`,
      });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const payAllAmount =
    debtInfo.earlyRepaymentFeeRate > 0
      ? Math.min(
          Math.floor(credits / (1 + debtInfo.earlyRepaymentFeeRate)),
          debtInfo.debt
        )
      : Math.min(credits, debtInfo.debt);
  const payAll = () => handlePayment(payAllAmount);

  const lienPercent = Math.round(debtInfo.lienRate * 100);
  const interestPercent = Math.round(debtInfo.interestRate * 100);
  const daysUntilInterest = Math.max(0, debtInfo.nextInterestDay - currentDay);

  return (
    <div id="finance-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2>콜 신용 한도</h2>

      <div className="finance-content">
        <div className="finance-section">
          <h3>부채 개요</h3>
          <div className="info-row">
            <span className="label">잔액:</span>
            <span className="value">₡{debtInfo.debt.toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="label">원천징수:</span>
            <span className="value">{lienPercent}% (거래 매출 기준)</span>
          </div>
          <div className="info-row">
            <span className="label">이자:</span>
            <span className="value">
              {interestPercent}% /  {COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS}{' '}
              일마다
            </span>
          </div>
          <div className="info-row">
            <span className="label">다음 이자:</span>
            <span className="value">
              {debtInfo.debt > 0 ? `${daysUntilInterest} days` : 'N/A'}
            </span>
          </div>
        </div>

        {debtInfo.debt > 0 && (
          <div className="finance-section">
            <h3>상환하기</h3>
            {debtInfo.earlyRepaymentFeeRate > 0 && (
              <p className="finance-warning">
                조기 상환:{' '}
                {Math.round(debtInfo.earlyRepaymentFeeRate * 100)}% 처리 수수료가 부과됩니다.
              </p>
            )}
            <div className="finance-buttons">
              {COLE_DEBT_CONFIG.PAYMENT_TIERS.map((amount) => {
                const payAmount = Math.min(amount, debtInfo.debt);
                const fee =
                  debtInfo.earlyRepaymentFeeRate > 0
                    ? Math.ceil(payAmount * debtInfo.earlyRepaymentFeeRate)
                    : 0;
                return (
                  <button
                    key={amount}
                    className="station-btn"
                    disabled={credits < payAmount + fee || debtInfo.debt === 0}
                    onClick={() => handlePayment(payAmount)}
                  >
                    ₡{payAmount}
                    {fee > 0 ? ` 지불 (+수수료 ₡${fee})` : ''}
                  </button>
                );
              })}
              {(() => {
                const payAllFee =
                  debtInfo.earlyRepaymentFeeRate > 0
                    ? Math.ceil(payAllAmount * debtInfo.earlyRepaymentFeeRate)
                    : 0;
                return (
                  <button
                    className="station-btn"
                    disabled={payAllAmount <= 0 || debtInfo.debt === 0}
                    onClick={payAll}
                  >
                    전액 상환 (₡{payAllAmount.toLocaleString()}
                    {payAllFee > 0 ? ` +수수료 ₡${payAllFee}` : ''})
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        <div className="finance-section">
          <h3>긴급 대출</h3>
          <p className="finance-warning">
            대출을 받으면 원천징수율이 오르고 콜의 이목을 끌게 됩니다.
          </p>
          <div className="info-row">
            <span className="label">가능 한도:</span>
            <span className="value">
              최대 ₡{debtInfo.maxDraw.toLocaleString()}
            </span>
          </div>
          <div className="finance-buttons">
            {debtInfo.availableDrawTiers.map((amount) => (
              <button
                key={amount}
                className="station-btn borrow-btn"
                onClick={() => handleBorrow(amount)}
              >
                ₡ 차입{amount}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`validation-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
