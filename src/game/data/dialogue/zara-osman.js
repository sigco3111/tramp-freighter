/**
 * @fileoverview Zara Osman Dialogue Tree
 *
 * A sharp trader with connections across the sector who is competitive but fair.
 * Uses casual speech with slang vocabulary and trading jargon quirks.
 * Provides market-focused tips and trading expertise based on relationship tier.
 *
 * @module dialogue/zara-osman
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

/**
 * Zara Osman Dialogue Tree - Trader at Luyten's Star
 *
 * A sharp trader with connections across the sector who is competitive but fair.
 * Uses casual speech with slang vocabulary and trading jargon quirks.
 * Provides market-focused tips and trading expertise based on relationship tier.
 *
 * Personality: Moderate trust (0.5), moderate-high greed (0.6), moderate loyalty (0.6), moderate morality (0.5)
 * Speech: Casual greeting style, slang vocabulary, trading jargon quirk
 *
 * Dialogue Flow:
 * - greeting → trading_business → (market_knowledge | competition_talk) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const ZARA_OSMAN_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          '어이, 파트너! 같은 업계 식구를 보니 언제나 좋아. 장사는 탄탄해, 자네는 어때? 같이 크레딧 좀 크게 벌어 볼 준비됐어?';
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "오호! 누가 돌아왔나 했더니. 이 거래 게임 요령을 제대로 잡았네, 안 그래? 오늘은 어떤 수야, 허세꾼?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "어이, 다시 봐서 반가워! 시장 감각이 제대로 붙고 있어. 그런 상인이 마음에 들어. 무슨 일로 왔어?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "또 한 판 하러 왔나? 존중해 줄게. 요즘 시장이 흥미롭거든. 어떤 각도로 가려고?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "재산을 일구려는 또 한 명의 상인. 섹터엔 모두를 위한 자리가 있지... 뭘 하는지 안다면. 뭐가 필요해?";
      }

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              "\n\n*이봐, 그 대출 말인데, 오백 크레딧이고 시계가 다 됐어. 정산할 시간이야, 파트너.*";
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*간단히 알려 줄게, 오백 크레딧을 ${daysRemaining}일 안에 갚아야 해. 놓치지 마, 응?*`;
          } else {
            baseText += `\n\n*아, 그리고 아직 오백 크레딧 갚아야 해. 시계가 ${daysRemaining}일 남았어.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '거래 사업에 대해 알려 줘요.',
        next: 'trading_business',
      },
      {
        text: '시장 팁이 있나요?',
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
        text: '지금은 없어요. 나중에 봐요.',
        next: null,
      },
    ],
  },

  trading_business: {
    text: "거래는 흐름을 읽는 거야, 알지? 시장은 숨을 쉬어. 팽창하고, 수축하고, 해류를 따라 변하지. 똑똑한 돈은 패턴을 따르고 더 똑똑한 돈은 패턴을 앞서가. 싸게 사서 비싸게 파는 게 다가 아니야. 조류가 언제 바뀔지 아는 거지.",
    choices: [
      {
        text: '시장 패턴을 어떻게 읽나요?',
        next: 'market_knowledge',
        repGain: 2,
      },
      {
        text: '경쟁이 치열할 것 같네요.',
        next: 'competition_talk',
        repGain: 1,
      },
      {
        text: '시장은 예측하기 어려울 수 있죠.',
        next: 'market_unpredictable',
        repGain: 1,
      },
      {
        text: '흥미로운 관점이네요.',
        next: 'greeting',
      },
    ],
  },

  market_knowledge: {
    text: "이제야 제대로 된 질문이야! 전부 인맥, 정보, 타이밍이야. 광산 정거장을 지켜봐. 광석이 넘쳐날 때 사치품 항성계가 금광이 돼. 경제 이벤트는 파도처럼 섹터를 퍼져 나가. 파도를 제대로 타면 이윤의 도시까지 가는 거야.",
    choices: [
      {
        text: '시장 정보는 어디서 얻나요?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '아주 일리 있네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  competition_talk: {
    text: "경쟁은 우릴 날카롭게 하고 시장을 정직하게 만들어. 다른 상인이 돈 버는 건 상관없어. 실력 있는 사람에겐 섹터가 충분히 넓으니까. 하지만 아마추어가 패닉 매도로 가격을 무너뜨리는 건 싫어. 모두의 수익에 타격이니까.",
    choices: [
      {
        text: '가격 폭락엔 어떻게 대처하나요?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '공정한 경쟁은 모두에게 이득이죠.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '전 각자도생이라고 생각해요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  market_unpredictable: {
    text: "맞아! 시장은 중력 우물 속 배보다 빨리 뒤집혀. 그래서 여러 각도가 필요해. 분산된 화물, 유연한 항로, 탄탄한 인맥. 아무리 달콤해 보여도 크레딧을 한 거래에 다 걸지 마. 공허엔 그 교훈을 뼈아프게 배운 상인이 가득해.",
    choices: [
      {
        text: '분산은 영리한 전략이죠.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '좋은 조언이에요. 고마워요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  ask_tip: {
    text: "물론이지! 동료 상인에게 시장 지혜를 나누는 건 늘 즐거워. 이 바닥에선 정보가 양방향으로 흘러. 뿌린 대로 거두는 법이지. 교역망에서 갓 나온 따끈한 걸 알려 줄게...",
    flags: ['osman_tip_requested'],
    choices: [
      {
        text: '그 정보는 상당한 크레딧 가치가 있겠네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '시장 팁 고마워요, 자라.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: "긴급 대출? 오백 크레딧... *의자에 기대앉는다* 이봐, 나도 그런 처지였어. 가끔 시장이 변화구를 던져서 자본이 급히 필요해지지. 크레딧은 빌려줄 수 있지만 표준 조건이야. 삼십 일, 연장 없음. 거래할래?",
    flags: ['osman_loan_discussed'],
    choices: [
      {
        text: '좋아요. 고마워요, 자라.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: '그 조건을 생각해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: '화물 보관? 응, 처리해 줄 수 있어. 이 전초기지에 안전한 공간이 있어. 열 단위까지, 온도 조절되고 갖출 건 다 갖췄지. 상인끼리의 직업적 예우로 쳐 줘. 이 바닥에선 서로 챙겨야지.',
    flags: ['osman_storage_discussed'],
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
        text: '직업적 예우 감사해요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "대출 상환? *장부를 확인한다* 그래, 오백 크레딧. 약속을 지키는 모습이 보기 좋네. 이 바닥에서 프로와 아마추어를 가르는 게 그거야. 거래에선 평판이 전부거든.",
    flags: ['osman_loan_repaid'],
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
        text: '크레딧을 모을 시간이 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "화물을 찾는다고? 문제없어, 친구. *보관소로 간다* 물건은 단단히 잠가 놨어. 온도 조절에 보안 감시까지 풀 패키지지. 네 배로 옮겨 줄게. 화물칸이 좁아지면 방법을 찾아보자고.",
    flags: ['osman_cargo_retrieved'],
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
        text: '먼저 공간을 좀 비울게요.',
        next: 'greeting',
      },
    ],
  },
};
