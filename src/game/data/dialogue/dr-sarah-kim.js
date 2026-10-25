/**
 * @fileoverview Dr. Sarah Kim Dialogue Tree
 *
 * Station Administrator at Tau Ceti - An efficient administrator who values professionalism
 * and proper procedures. Uses formal speech with technical vocabulary and frequently cites
 * regulations. Provides operational tips and docking-related benefits based on relationship tier.
 *
 * @module dialogue/dr-sarah-kim
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

/**
 * Dr. Sarah Kim Dialogue Tree - Station Administrator at Tau Ceti
 *
 * Character Profile:
 * - Role: Station Administrator at Tau Ceti
 * - Personality: Efficient, values professionalism and proper procedures
 * - Speech Style: Formal vocabulary, technical terms, frequently cites regulations
 * - Benefits: Operational tips and docking-related services based on relationship tier
 *
 * Dialogue Flow:
 * - greeting → station_operations → (procedures_important | efficiency_matters) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const DR_SARAH_KIM_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error('Dr. Sarah Kim dialogue: reputation must be a number');
      }

      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "다시 오셨군요! 이렇게 전문적인 상인과 일하는 건 언제나 기쁩니다. 귀하의 운영 수준은 모범적입니다. 오늘은 무엇을 도와드릴까요?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          '다시 뵙게 되어 반갑습니다. 정거장 규정을 꾸준히 준수하시는 점을 확인하고 감사드립니다. 무엇을 도와드릴까요?';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          '안녕하세요! 정거장 운영에 대한 전문적인 접근이 신선했습니다. 요즘 어떠세요?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "타우 세티 정거장에 다시 오신 걸 환영합니다. 절차를 잘 지키시는 점을 눈여겨봤습니다. 오늘은 무슨 일로 오셨나요?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          '타우 세티 정거장에 오신 것을 환영합니다. 모든 서류가 갖춰졌는지 확인해 주세요. 어디로 안내해 드릴까요?';
      }

      // Add loan status if there's an outstanding loan (when context is available)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*금융 규정 12-A에 따라 ₡500 대출이 연체되었습니다. 즉시 상환이 필요합니다.*';
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*금융 안내: 표준 조건에 따라 ₡500 대출 상환일이 ${daysRemaining}일 남았습니다.*`;
          } else {
            baseText += `\n\n*미결 금융 채무: ₡500, 약정에 따라 ${daysRemaining}일 남았습니다.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '정거장 운영에 대해 알려 주세요.',
        next: 'station_operations',
      },
      {
        text: '운영상 요령이 있을까요?',
        next: 'ask_tip',
        condition: (rep, context) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          return context.canGetTip.available;
        },
      },
      {
        text: '긴급 대출이 필요해요.',
        next: 'request_loan',
        condition: (rep, context) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          return context.canRequestLoan.available;
        },
      },
      {
        text: '화물을 좀 맡아 주실 수 있나요?',
        next: 'request_storage',
        condition: (rep, context) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          // Fall back to reputation-only check if context not available (e.g., in tests)
          if (!context || !context.canRequestStorage) return true;
          return context.canRequestStorage.available;
        },
      },
      {
        text: '대출을 갚고 싶어요.',
        next: 'repay_loan',
        condition: (_rep, context) => {
          // Check if NPC has an outstanding loan
          const npcState = context.npcState;
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: '맡겨 둔 화물을 찾고 싶어요.',
        next: 'retrieve_cargo',
        condition: (_rep, context) => {
          // Check if NPC has stored cargo
          const npcState = context.npcState;
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
      },
      {
        text: '지금은 없어요. 감사합니다.',
        next: null,
      },
    ],
  },

  station_operations: {
    text: '타우 세티 정거장은 규정 47-B에 따라 엄격한 효율 프로토콜로 운영됩니다. 화물 처리, 세관 업무, 선박 정비에서 최고 수준을 유지합니다. 올바른 서류와 절차 준수가 모두의 원활한 운영을 보장합니다.',
    choices: [
      {
        text: '절차는 안전을 위해 중요하죠.',
        next: 'procedures_important',
        repGain: 3,
      },
      {
        text: '거래에서는 효율이 중요하죠.',
        next: 'efficiency_matters',
        repGain: 2,
      },
      {
        text: '규정이 일을 더디게 할 때도 있죠.',
        next: 'regulation_defense',
        repGain: -2,
      },
      {
        text: '알겠어요. 감사합니다.',
        next: 'greeting',
      },
    ],
  },

  procedures_important: {
    text: '맞습니다! 체계적인 운영의 중요성을 이해하시는군요. 규정 23-C는 올바른 절차가 운영 사고의 94%를 예방한다고 명시하고 있습니다. 귀하 같은 전문 상인 덕분에 제 일이 훨씬 수월해집니다.',
    choices: [
      {
        text: '잘 운영되는 정거장이 좋아요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '좋은 체계는 모두에게 이득이죠.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  efficiency_matters: {
    text: '정확합니다. 효율적인 운영은 모든 당사자에게 이익입니다. 처리 시간 단축, 운영 비용 절감, 안전 여유 확대. 상인들이 정해진 프로토콜을 따르면 최신 효율 지표 기준으로 요청을 40% 더 빨리 처리할 수 있습니다.',
    choices: [
      {
        text: '인상적인 수치네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "명심할게요.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  regulation_defense: {
    text: '그 관점은 이해하지만 이것도 생각해 보십시오. 규정 15-D는 2387년에 통제되지 않은 화물 이송으로 중대 사고가 세 건 발생했기 때문에 존재합니다. 이 절차들은 상인, 정거장 직원, 화물의 온전함 모두를 보호합니다.',
    choices: [
      {
        text: "안전 측면은 생각하지 못했어요.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '사고 얘기는 일리가 있네요.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '그래도 제겐 과해 보여요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "물론입니다. 운영 효율은 올바른 계획과 정해진 프로토콜 준수로 높아집니다. 거래 운영을 최적화하는 데 도움이 될 만한 걸 알려 드리죠...",
    flags: ['kim_tip_requested'],
    choices: [
      {
        text: '그 정보 정말 유용하네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '운영 안내 감사합니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: '긴급 대출 요청이군요... 금융 규정 12-A에 따라 운영 기록이 확립된 신뢰 상인에게는 오백 크레딧 긴급 선지급을 승인할 수 있습니다. 표준 삼십 일 상환 조건이 적용됩니다.',
    flags: ['kim_loan_discussed'],
    choices: [
      {
        text: '그 조건을 받아들일게요.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: '먼저 조건을 검토해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: '정거장 프로토콜 8-C에 따라 확립된 상인께 화물 보관 서비스를 제공합니다. 보안 보관 시설에 최대 열 단위까지 수용할 수 있습니다. 모든 물품은 표준 재고 절차에 따라 기록되고 추적됩니다.',
    flags: ['kim_storage_discussed'],
    choices: [
      {
        text: '정말 도움이 되겠어요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.storeCargo();
        },
      },
      {
        text: '그런 서비스가 있다니 다행이네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: '대출 상환 처리 중... 금융 규정 12-A에 따라 오백 크레딧 상환 수령을 확인합니다. 거래가 기록되었으며 귀하의 계정은 정상 상태입니다. 금융 채무에 신속히 대응해 주셔서 감사합니다.',
    flags: ['kim_loan_repaid'],
    choices: [
      {
        text: '여기 크레딧이에요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
        },
      },
      {
        text: '크레딧을 마련할 시간이 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: '화물 반환 요청을 접수했습니다. 정거장 프로토콜 8-C에 따라 보관 물품을 귀하의 선박으로 이송할 수 있습니다. 이송 용량은 현재 화물칸 여유 공간에 따라 제한됨을 유의해 주십시오.',
    flags: ['kim_cargo_retrieved'],
    choices: [
      {
        text: '실을 수 있는 만큼 제 배로 옮겨 주세요.',
        next: 'greeting',
        repGain: 1,
        action: (context) => {
          return context.retrieveCargo();
        },
      },
      {
        text: '먼저 공간을 좀 만들게요.',
        next: 'greeting',
      },
    ],
  },
};
