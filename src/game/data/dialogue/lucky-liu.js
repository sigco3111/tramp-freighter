/**
 * @fileoverview Lucky Liu Dialogue Tree
 *
 * A professional gambler and risk-taker who loves long odds and respects bold moves.
 * Uses casual speech with slang vocabulary and gambling metaphors throughout conversation.
 * Provides risk-taking tips and high-stakes opportunities based on relationship tier.
 *
 * @module dialogue/lucky-liu
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

/**
 * "Lucky" Liu Dialogue Tree - Gambler at Wolf 359
 *
 * A professional gambler and risk-taker who loves long odds and respects bold moves.
 * Uses casual speech with slang vocabulary and gambling metaphors throughout conversation.
 * Provides risk-taking tips and high-stakes opportunities based on relationship tier.
 *
 * Personality: Moderate-high trust (0.6), very high greed (0.8), low loyalty (0.4), low morality (0.3)
 * Speech: Casual greeting style, slang vocabulary, gambling metaphors quirk
 *
 * Dialogue Flow:
 * - greeting → gambling_talk → (risk_philosophy | odds_discussion) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const LUCKY_LIU_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "어이, 큰손! 내 테이블에 돌아온 걸 환영해. 이제 큰 판에서 놀 배짱이 생겼군. 오늘은 어떤 판이지, 파트너?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "오호! 이게 누구야, 확률을 다룰 줄 알게 됐구먼. 이 판에 제대로 맛을 들이고 있군, 안 그래? 러키의 자리엔 무슨 일로?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "어이, 친구! 모험을 겁내지 않는 사람을 보니 좋군. 하우스가 늘 이기지만 똑똑한 플레이어는 크게 걸 때를 알지. 어떤 수를 쓸 거야?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          '또 한 판 하러 왔나? 그런 상인이 마음에 들어. 행운은 대담한 자의 편이라고 하잖아. 러키가 뭘 해 줄까?';
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "테이블에 플레이어가 하나 더 왔군. 문제는 말이야, 판에 끼러 온 거야, 구경만 하러 온 거야? 어떤 게임을 할 거지, 선장?";
      }

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText += `\n\n*내가 빌려준 판돈 얘기인데, ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧이야. 하우스는 늘 받아 가지. 정산할 시간이야, 친구.*`;
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*판돈 건 간단히 알려 주지, ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧을 ${daysRemaining}일 안에 갚아야 해. 너무 오래 끌지 마, 응?*`;
          } else {
            baseText += `\n\n*아, 그리고 그 판돈 ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧 아직 갚아야 해. 시계가 ${daysRemaining}일 남았어.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '도박 사업에 대해 알려 줘요.',
        next: 'gambling_talk',
      },
      {
        text: '위험을 감수하는 요령이 있나요?',
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
        text: '화물을 좀 맡아 줄 수 있나요?',
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
        text: '지금은 없어요. 또 봐요, 러키.',
        next: null,
      },
    ],
  },

  gambling_talk: {
    text: "도박? 아니, 그건 아마추어들이 부르는 말이야. 난 '수익 가능성이 있는 계산된 위험 평가'라고 부르지. 대부분은 안전하게 가잖아. 작은 판돈, 확실한 패, 꾸준한 수익. 하지만 진짜 돈은? 다들 겁나서 못 건드리는 확률을 읽는 데 있어. 고위험 고수익이지, 베이비!",
    choices: [
      {
        text: "위험을 감수하는 철학이 뭔가요?",
        next: 'risk_philosophy',
        repGain: 2,
      },
      {
        text: '확률은 어떻게 계산하죠?',
        next: 'odds_discussion',
        repGain: 1,
      },
      {
        text: '전 안전한 투자가 좋아요.',
        next: 'safe_investments',
        repGain: -1,
      },
      {
        text: '흥미로운 관점이네요.',
        next: 'greeting',
      },
    ],
  },

  risk_philosophy: {
    text: "내 철학? 간단해. 겁먹은 돈은 돈을 못 벌어. 크게 이기려면 전부 잃을 각오가 있어야 해. 하지만 핵심은 무모하게 구는 게 아니야. 패가 내 쪽으로 기울어 있는 순간을 알아보고, 그때가 오면 올인할 배짱이 있느냐지.",
    choices: [
      {
        text: '그 순간이 맞는 때인지 어떻게 알죠?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '진짜 용기가 필요하겠네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '쫄딱 망하기 좋은 방법 같은데요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  odds_discussion: {
    text: "확률 계산? 대부분 거기서 틀려. 숫자만 보거든. 하지만 진짜 확률엔 수치로 못 재는 것들이 들어가. 절박함, 탐욕, 두려움, 타이밍. 종이 위에선 확실한 손해로 보이는 화물 운송도 적절한 사람들이 절박해지는 걸 알면 순금일 수 있지.",
    choices: [
      {
        text: '정보도 방정식의 일부군요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '심리도 수학만큼 중요하죠.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "그래도 숫자는 거짓말 안 하잖아요.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  safe_investments: {
    text: "안전한 투자? *피식 웃는다* 그래, 3% 수익을 올리고 밤에 잘 자고 일흔에 편안히 은퇴하겠지. 하지만 네가 안전하게 노는 동안 다른 누군가는 큰 건을 터뜨려. 인생은 어차피 도박이야. 재미있게 걸어 보는 게 낫지.",
    choices: [
      {
        text: '더 모험을 해 봐야겠어요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "두 방식 다 지혜가 있네요.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "전 꾸준한 수익을 고수할래요.",
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "위험 감수 요령? 아, 얼마든지! 대부분의 상인은 작게 생각해. 패가 뜨거울 때 크게 거는 걸 두려워하지. 하지만 기회를 보는 관점을 바꿔 줄 만한 걸 하나 알려 줄게...",
    flags: ['liu_tip_requested'],
    choices: [
      {
        text: '그건 상당한 크레딧 가치가 있겠네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '도박 지혜 고마워요, 러키.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: `긴급 대출? *의자에 기대앉는다* ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧이라... 흥미롭군. 보통은 대출 말고 판돈을 빌리러 오는데 말이야. 하지만 네 스타일이 마음에 들어. 칩이 모자랄 땐 더블다운도 해야지. ${NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE}일 안에 갚는 표준 조건이야. 할래?`,
    flags: ['liu_loan_discussed'],
    choices: [
      {
        text: '좋아요. 판돈 고마워요, 러키.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: '그 확률을 먼저 생각해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: `화물 보관? 물론이지, 친구. 뒤쪽에 안전한 공간이 있어. 최대 ${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT}단위까지, 도둑 손길과 눈치 빠른 눈으로부터 안전하게. 플레이어끼리의 호의로 쳐 줘. 다음 큰 판 전에 딴 돈을 숨겨 둬야 할 때도 있잖아, 안 그래?`,
    flags: ['liu_storage_discussed'],
    choices: [
      {
        text: '제 게임에 정말 도움이 되겠어요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.storeCargo();
        },
      },
      {
        text: '동료 플레이어를 챙겨 줘서 고마워요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: `대출 상환? *씩 웃으며 장부를 확인한다* ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} 크레딧, 딱 맞춰서 왔군. 언제 판돈을 회수하고 빚을 정리해야 하는지 아는 플레이어가 좋아. 게임을 이해한다는 증거지. 큰 승리가 전부가 아니야, 판에 계속 남아 있는 게 중요하지.`,
    flags: ['liu_loan_repaid'],
    choices: [
      {
        text: '여기 크레딧이에요. 판돈 고마워요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
        },
      },
      {
        text: '전액을 마련하려면 시간이 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "맡긴 물건을 찾겠다고? *뒷방으로 간다* 문제없어, 친구. 물건은 단단히 잠가 놨어. 웬만한 은행보다 보안이 좋고 두 배는 입이 무겁지. 네 배로 화물을 옮겨 줄게. 화물칸이 붐비면 세부 사항을 조율해 보자고.",
    flags: ['liu_cargo_retrieved'],
    choices: [
      {
        text: '실을 수 있는 만큼 제 배로 옮겨 줘요.',
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
