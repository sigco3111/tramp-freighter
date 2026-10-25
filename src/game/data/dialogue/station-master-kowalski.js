/**
 * @fileoverview Station Master Kowalski Dialogue Tree
 *
 * A veteran station master who has seen everything and respects competence above all.
 * Uses gruff speech with simple vocabulary and no-nonsense direct communication.
 * Provides station operation tips and docking-related benefits based on relationship tier.
 *
 * @module dialogue/station-master-kowalski
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

/**
 * Station Master Kowalski Dialogue Tree - Station Master at Alpha Centauri
 *
 * A veteran station master who has seen everything and respects competence above all.
 * Uses gruff speech with simple vocabulary and no-nonsense direct communication.
 * Provides station operation tips and docking-related benefits based on relationship tier.
 *
 * Personality: Low trust (0.3), low-moderate greed (0.4), high loyalty (0.7), high morality (0.7)
 * Speech: Gruff greeting style, simple vocabulary, no-nonsense direct quirk
 *
 * Dialogue Flow:
 * - greeting → station_business → (competence_matters | standards_important) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const STATION_MASTER_KOWALSKI_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "이야, 이게 누구야! 자네는 진짜 프로라는 걸 증명했어, 선장. 자네 같은 상인이 있으면 이 정거장이 더 잘 돌아가지. 뭐가 필요한가?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          '다시 보니 반갑군, 선장. 정거장 운영에 대한 자네의 전문적인 태도는 눈여겨보고 있네. 오늘은 뭘 도와줄까?';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "이제 단골이 되어 가는군. 절차를 따르고 정거장을 존중하는 상인이 좋지. 무슨 일로 왔나?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "또 왔군. 여기 돌아가는 방식을 배우고 있어. 좋은 일이야. 뭐가 필요한가?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "또 한 명의 상인이군. 도킹 요금은 냈나? 좋아. 프로답게 하면 문제없을 걸세. 무슨 용건인가?";
      }

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText += `\n\n*자네 ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧 대출이 연체되었네, 선장. 정거장 방침상 즉시 상환해야 하네.*`;
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*알림: 자네 ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧 대출 상환일이 ${daysRemaining}일 남았네. 정거장 방침상 연장은 없네.*`;
          } else {
            baseText += `\n\n*미상환 대출: ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧, 정거장 방침에 따라 ${daysRemaining}일 남았네.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '이 정거장을 운영하는 일에 대해 알려 주세요.',
        next: 'station_business',
      },
      {
        text: '정거장 운영 요령이 있나요?',
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
        text: '지금은 없어요. 고맙습니다, 정거장장님.',
        next: null,
      },
    ],
  },

  station_business: {
    text: "정거장을 운영하는 건 화려한 일은 아니지만 중요한 일이네. 불을 켜 두고, 공기를 돌리고, 부두를 비워 두지. 상인은 오가지만 정거장은 남아. 능력, 규율, 올바른 절차에 대한 존중이 필요하지. 여기엔 카우보이나 허세꾼이 설 자리는 없네.",
    choices: [
      {
        text: '무엇보다 능력이 중요하죠.',
        next: 'competence_matters',
        repGain: 3,
      },
      {
        text: '기준은 안전을 위해 중요하죠.',
        next: 'standards_important',
        repGain: 2,
      },
      {
        text: '관료주의가 심한 것 같네요.',
        next: 'bureaucracy_response',
        repGain: -2,
      },
      {
        text: '알겠어요. 감사합니다.',
        next: 'greeting',
      },
    ],
  },

  competence_matters: {
    text: "맞아. 젊든 늙든, 인간이든 아니든 상관없네. 선체를 긁지 않고 도킹할 수 있나? 안전 프로토콜을 따르나? 요금을 제때 내나? 그게 중요하지. 여기선 능력이 존중을 얻네.",
    choices: [
      {
        text: '모든 거래에서 프로답게 하려고 해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '좋은 기준은 모두에게 이익이죠.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  standards_important: {
    text: "그렇지. 기준은 삶을 어렵게 하려는 게 아니라 사람을 살려 두려는 거네. 엉성한 절차, 서두른 도킹, 무시된 안전 점검으로 일어난 사고를 너무 많이 봤어. 여기 모든 규정은 누군가의 피로 쓰였네. 기억해 두게.",
    choices: [
      {
        text: '그런 식으로 생각해 본 적이 없어요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '안전이 늘 먼저여야죠.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  bureaucracy_response: {
    text: "관료주의? *눈을 가늘게 뜬다* 아마추어들은 올바른 절차를 그렇게 부르지. 생명 유지 장치가 고장 나 비상 도킹이 필요해지면 우리의 '관료주의'에 감사하게 될 걸세. 다른 모든 게 엉망이 될 때 이 정거장을 돌아가게 하는 게 바로 그거네.",
    choices: [
      {
        text: "맞아요. 그 말은 사과드립니다.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "무시하려던 건 아니에요.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '그래도 형식이 너무 많아 보여요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "정거장 운영 요령? 물론이지. 이십 년간 정거장을 운영했으니 효율적인 운영에 대해 몇 가지 배웠네. 정거장 직원들과 더 잘 일하는 데 도움이 될 만한 걸 알려 주지...",
    flags: ['kowalski_tip_requested'],
    choices: [
      {
        text: '그 정보 정말 유용하네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '운영 조언 고맙습니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: `긴급 대출? ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧이라... *기록을 확인한다* 자네 운영 기록은 능력과 신뢰성을 보여 주는군. 선지급은 승인할 수 있지만 ${NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE}일 안에 상환받아야 하네. 정거장 방침이야. 예외는 없네.`,
    flags: ['kowalski_loan_discussed'],
    choices: [
      {
        text: '그 조건 받아들일게요.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: '먼저 조건을 생각해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: `화물 보관? 확립된 상인을 위해 보안 보관소를 운영하네. 보세 창고에 최대 ${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT}단위까지. 전문 상인을 위한 전문 서비스지. 표준 보안 프로토콜이 적용되네.`,
    flags: ['kowalski_storage_discussed'],
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
        text: '전문적인 서비스에 감사드려요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: `대출 상환을 확인했네. *정거장 기록을 확인한다* 약속대로 ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧이군. 금융 채무에 신속히 대응한 점을 기록해 두겠네. 이런 전문적인 태도가 정거장을 원활히 돌아가게 하지.`,
    flags: ['kowalski_loan_repaid'],
    choices: [
      {
        text: '여기 크레딧이에요. 대출 감사합니다.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
        },
      },
      {
        text: '전액을 마련할 시간이 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: '화물 반환 요청을 처리했네. *정거장 재고에 접근한다* 자네 물품은 표준 프로토콜에 따라 보세 보관소에 안전하게 있네. 자네 선박으로 이송을 시작하지. 이송 용량은 현재 화물칸 상태에 따라 제한된다는 점을 유념하게.',
    flags: ['kowalski_cargo_retrieved'],
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
        text: '먼저 화물칸에 공간을 만들게요.',
        next: 'greeting',
      },
    ],
  },
};
