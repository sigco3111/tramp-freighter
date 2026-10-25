/**
 * @fileoverview "Rusty" Rodriguez Dialogue Tree
 *
 * A gruff but skilled mechanic who loves ships more than people. Uses technical
 * vocabulary with ship personification quirks and provides repair-focused tips.
 * Offers repair service discounts based on relationship tier.
 *
 * @module dialogue/rusty-rodriguez
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

/**
 * "Rusty" Rodriguez Dialogue Tree - Mechanic at Procyon
 *
 * A gruff but skilled mechanic who loves ships more than people. Uses technical
 * vocabulary with ship personification quirks and provides repair-focused tips.
 * Offers repair service discounts based on relationship tier.
 *
 * Personality: High trust (0.7), low-moderate greed (0.4), high loyalty (0.8), moderate morality (0.5)
 * Speech: Gruff greeting style, technical vocabulary, ship personification quirk
 *
 * Dialogue Flow:
 * - greeting → ship_talk → (ship_care | maintenance_matters) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const RUSTY_RODRIGUEZ_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "이야, 이게 누구야! 돌아왔구먼. 배가 잘 해 주고 있길 바라네. 좋은 배야. 자네가 돌보는 걸 보면 알지. 오늘은 이 러스티가 뭘 해 줄까?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "다시 보니 반갑군, 선장. 볼 때마다 배 상태가 나아지는구먼. 배를 제대로 대하는 법을 배우고 있어. 내 가게엔 무슨 일로?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "어이! 배는 얌전히 굴고 있겠지? 선장이 뭘 아는지는 늘 알아보지. 뭘 도와줄까?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "또 왔나? 배 상태가 괜찮군. 여기 절뚝거리며 들어오는 녹슨 통들보단 낫지. 뭐가 필요한가?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "배 한 척에 선장 한 명 더. 맞혀 볼까, 뭔가 고장 났고 어제까지 고쳐 달라는 거지? 뭐가 문제야?";
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
              '\n\n*그 대출 말이네, 선장... 오백 크레딧이고 어제가 기한이었어. 자네 배는 자네가 믿음직하길 바라고 있네.*';
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*잊지 말게, 오백 크레딧을 ${daysRemaining}일 안에 갚아야 하네. 자네 배가 자네를 믿고 있어.*`;
          } else {
            baseText += `\n\n*참, 아직 오백 크레딧을 갚아야 하네. 갚을 날이 ${daysRemaining}일 남았어.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '배 정비에 대해 알려 주세요.',
        next: 'ship_talk',
      },
      {
        text: '정비 요령이 있나요?',
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
        text: '지금은 없어요. 고마워요, 러스티.',
        next: null,
      },
    ],
  },

  ship_talk: {
    text: "배는 살아 있는 존재라네. 말 그대로는 아니지만... 성격이 있어. 버릇도, 기분도. 제대로 대하면 무사히 집에 데려다주지. 소홀히 하면 가장 예상치 못한 순간에 공허에 발을 묶어 버려. 배가 자네에게 말을 건다네. 듣는 법만 배우면 돼.",
    choices: [
      {
        text: '제 배를 잘 돌보려고 해요.',
        next: 'ship_care',
        repGain: 3,
      },
      {
        text: '정기 정비가 중요하죠.',
        next: 'maintenance_matters',
        repGain: 2,
      },
      {
        text: "저한텐 그냥 기계예요.",
        next: 'just_machine',
        repGain: -2,
      },
      {
        text: '흥미로운 관점이네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  ship_care: {
    text: "그거야말로 내가 듣고 싶은 말이야! 배를 존중하는 선장이라. 저 바깥에서 힘든 일이 닥치면 배가 그 친절을 기억할 거야. 자기를 제대로 대해 준 선장을 위해 한계를 넘어서는 배를 봤지. 정비만이 아니라 동반자 관계라네.",
    choices: [
      {
        text: '저와 제 배는 한 팀이에요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '최고의 보살핌을 받을 자격이 있어요.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  maintenance_matters: {
    text: "바로 그거야! 정기 정비는 고장을 막는 것만이 아니야. 물론 그것도 중요하지만. 배의 리듬을 이해하는 거라네. 엔진 소리가 달라질 때, 선체가 압력에 휠 때, 생명 유지 주기가 바뀔 때. 지식이 저 바깥에서 자네를 살려 두지.",
    choices: [
      {
        text: '구체적으로 뭘 봐야 하죠?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '좋은 조언이에요. 고맙습니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  just_machine: {
    text: "그냥 기계라고? *고개를 젓는다* 거기서 자네가 틀렸어, 선장. 기계는 생명을 구하는 버릇을 만들지 않아. 기계는 가장 필요할 때 사양을 넘어서지 않지. 자네 배는 금속과 회로 이상이야. 생명줄이지. 그렇게 대하기 시작하는 게 좋을 걸세.",
    choices: [
      {
        text: "맞는 말씀일지도 모르겠네요.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "말씀하신 걸 생각해 볼게요.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '제겐 여전히 그냥 기계예요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "물론이지, 선장. 이십 년을 배를 만져 왔네. 건강하게 유지하는 법을 한두 가지 배웠지. 나중에 골칫거리를 덜어 줄 만한 걸 하나 알려 주지...",
    flags: ['rusty_tip_requested'],
    choices: [
      {
        text: '골칫거리를 많이 덜어 주겠네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '정비 조언 고맙습니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: "긴급 대출이라, 응? 오백 크레딧... *작업복에 손을 닦는다* 이봐, 배는 수리가 필요한데 지갑이 비면 어떤지 아네. 크레딧은 빌려줄 수 있지만 삼십 일 안에 돌려받아야 해. 공정하지?",
    flags: ['rusty_loan_discussed'],
    choices: [
      {
        text: '그 조건 받아들일게요. 고맙습니다.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: '먼저 생각해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: "화물 보관? 물론이지, 가게 뒤쪽에 안전한 공간이 있어. 열 단위까지, 비바람과 눈치 빠른 눈에서 안전하게. 전문가끼리의 호의로 쳐 주게. 정비공끼리는 뭉쳐야지, 자네가 렌치 반대편에 있더라도.",
    flags: ['rusty_storage_discussed'],
    choices: [
      {
        text: '정말 큰 도움이 되겠어요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.storeCargo();
        },
      },
      {
        text: '제안 감사합니다, 러스티.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "대출 상환? *작업복에 손을 닦는다* 약속을 지키는 모습이 보기 좋군, 선장. 오백 크레딧 맞지? 자네 배가 자랑스러워할 거야. 선장이 믿음직하면 좋아하거든.",
    flags: ['rusty_loan_repaid'],
    choices: [
      {
        text: '여기 크레딧이에요. 도와주셔서 감사해요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
        },
      },
      {
        text: '크레딧을 마련할 시간이 조금 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "화물을 찾는다고? 물론이지, 선장. *뒤쪽으로 간다* 물건은 안전하게 있네. 자네 배에 다시 실어 주지. 화물칸이 빠듯하면 말만 하게. 방법을 찾아보세.",
    flags: ['rusty_cargo_retrieved'],
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
