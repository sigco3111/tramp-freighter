/**
 * @fileoverview Wei Chen Dialogue Tree
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * @module dialogue/wei-chen
 */

import {
  REPUTATION_BOUNDS,
  ENDGAME_CONFIG,
  TANAKA_SUPPLY_CONFIG,
} from '../../constants.js';
import {
  hasFactionRep,
  hasGoodKarma,
  hasBadKarma,
  isWantedByAuthorities,
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
} from './faction-karma-conditions.js';

/**
 * Wei Chen Dialogue Tree - Dock Worker at Barnard's Star
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * Dialogue Flow:
 * - greeting → small_talk → (boring_response | honest_work) → greeting
 * - greeting → backstory (FRIENDLY_MIN tier) → backstory_2 → greeting
 */
export const WEI_CHEN_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          '여, 친구! 다시 보니 반갑네. 배는 잘 버텨 주고 있어?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText = "아, 당신이군. 장사는 어때? 배는 멀쩡해?";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        baseText = '또 한 명의 상인이네. 도킹 요금은 냈지? 좋아. 뭐가 필요해?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        baseText = '또 당신이야. 용건은 빨리 끝내. 할 일이 있으니까.';
      } else {
        baseText = "문제 일으키고 싶지 않아. 용건만 말하고 가.";
      }

      // Add karma-based first impression for new or low-reputation encounters
      if (context && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karmaModifier = getKarmaFirstImpression(context.karma, 'neutral');
        baseText += karmaModifier;
      }

      // Add faction attitude modifier if player has strong civilian reputation
      if (context && hasFactionRep('civilians', 50, context)) {
        baseText += getFactionAttitudeModifier('civilians', context);
      }

      return baseText;
    },
    choices: [
      {
        text: "그냥 얘기하는 거예요. 일은 어때요?",
        next: 'small_talk',
      },
      {
        text: '부두 일꾼으로서 알려 줄 요령이 있나요?',
        next: 'ask_tip',
        condition: (rep, context) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          return context.canGetTip.available;
        },
      },
      {
        text: '당신에 대해 알려 주세요.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: '나쁜 거래의 위험은 알고 있어요.',
        next: 'bad_deal_sympathy',
        condition: (rep, context) => {
          // Only available if player has bad karma (suggesting they've made questionable choices)
          // and at least neutral reputation with Wei Chen
          return (
            rep >= REPUTATION_BOUNDS.NEUTRAL_MIN &&
            context &&
            hasBadKarma(context)
          );
        },
      },
      {
        text: '당국과 문제를 피하는 조언이 있나요?',
        next: 'authority_advice',
        condition: (rep, context) => {
          // Only available if player is wanted by authorities and has warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            context &&
            isWantedByAuthorities(context)
          );
        },
      },
      {
        text: '할 수 있을 때 사람들을 도우려고 해요.',
        next: 'good_karma_response',
        condition: (rep, context) => {
          // Only available if player has good karma and neutral+ reputation
          return (
            rep >= REPUTATION_BOUNDS.NEUTRAL_MIN &&
            context &&
            hasGoodKarma(context)
          );
        },
      },
      {
        text: '"보어 정거장 7은 뭐가 문제죠?"',
        next: 'station_gossip',
        condition: (_rep, context) =>
          context && !context.narrativeFlags?.tanaka_met,
      },
      {
        text: '"타나카에 대해 아는 게 있나요?"',
        next: 'tanaka_gossip',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          return context.getQuestStage('tanaka') === 0;
        },
      },
      {
        text: '"요즘 타나카는 어때요?"',
        next: 'tanaka_progress',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          const stage = context.getQuestStage('tanaka');
          if (stage < 1 || stage >= 5) return false;
          const nextStage = stage + 1;
          return !context.canStartQuestStage('tanaka', nextStage);
        },
      },
      {
        text: '지금은 없어요. 몸 조심하세요.',
        next: null,
      },
    ],
  },

  small_talk: {
    text: "일은 일이지. 부두가 저절로 돌아가진 않아. 배가 오고 배가 가고. 자기가 뭘 하는지 아는 선장도 있고, 그렇지 않은 선장도 있어. 구별하는 법을 배우게 돼.",
    choices: [
      {
        text: '지루하게 들리네요.',
        next: 'boring_response',
        repGain: -2,
      },
      {
        text: '정직한 일은 좋은 일이죠.',
        next: 'honest_work',
        repGain: 3,
      },
      {
        text: '이만 일하시게 두는 게 좋겠네요.',
        next: 'greeting',
      },
    ],
  },

  boring_response: {
    text: "지루해? 당신한텐 그럴지도. 하지만 안전하게 도킹하는 배 하나하나, 목적지에 닿는 화물 하나하나... 그게 중요한 거야. 중요한 일이 다 흥미진진할 필요는 없어.",
    choices: [
      {
        text: "맞아요. 무시하려던 건 아니에요.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '그렇다면야.',
        next: 'greeting',
      },
    ],
  },

  honest_work: {
    text: "맞아. 예전엔 흥분이 전부라고 생각했지. 모험, 위험, 큰 건... 더 잘 배웠어. 꾸준한 일, 꾸준한 보수, 발밑의 단단한 땅. 그것도 가치가 있어.",
    choices: [
      {
        text: "사연이 있는 것 같네요.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '현명한 말이네요. 얘기 고마워요.',
        next: 'greeting',
      },
    ],
  },

  backstory: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "물어봤으니 말하는데... 한때 내 배의 선장이었어. '럭키 스트라이크'호. 남들이 안 하는 위험을 감수하는 내가 똑똑한 줄 알았지. 엉뚱한 사람들과의 나쁜 거래 한 번에... 그래서 지금은 부두에서 일해. 배는 사라지고 선원은 흩어졌지. 그래도 난 여기 있어.";
      } else {
        return "한때 내 배가 있었어. 잘못된 선택을 하고 엉뚱한 사람을 믿어서 모든 걸 잃었지. 하지만 이제 옛날 얘기야. 부두는 나한테 잘해 줘.";
      }
    },
    flags: ['chen_backstory_1'],
    choices: [
      {
        text: "그런 일을 겪으셨다니 유감이에요.",
        next: 'backstory_2',
        repGain: 3,
      },
      {
        text: '어떤 나쁜 거래였나요?',
        next: 'backstory_2',
        repGain: 1,
      },
      {
        text: '누구나 실수는 하죠.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  backstory_2: {
    text: "고마워. 요점은 교훈을 얻었다는 거야. 요즘은 다른 선장들이 같은 실수를 피하도록 도와. 자기가 다 안다고 생각하는 젊은 허세꾼들이 많이 지나가거든. 들을 때는 좋은 조언을 주려고 해.",
    flags: ['chen_backstory_2'],
    choices: [
      {
        text: '저한테 해 줄 조언이 있나요?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '이야기해 주셔서 고마워요.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  ask_tip: {
    text: "부두 일꾼 요령? 물론이지. 몇 년 동안 이 부두에서 일하면서 화물과 배를 안전하게 지키는 법을 몇 가지 배웠어. 저 바깥에서 도움이 될 만한 걸 하나 알려 줄게...",
    flags: ['chen_tip_requested'],
    choices: [
      {
        text: "정말 도움이 되네요. 고마워요!",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '알아 둘게요. 고맙습니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  bad_deal_sympathy: {
    text: "그래... 눈에서 보여. 힘든 선택을 했겠지? 섹터가 늘 깔끔한 선택지를 주진 않아. 때로는 살아남으려고 해야 할 일을 하는 거지. 이해해.",
    flags: ['chen_bad_deal_sympathy'],
    choices: [
      {
        text: '맞아요. 때로는 좋은 선택지가 없죠.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '할 수 있을 때는 더 잘하려고 해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '생존이 먼저죠.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  authority_advice: {
    text: "당국이 괴롭혀? 이봐, 법과 엇나간 선장을 많이 봤어. 최고의 조언? 고개 숙이고, 벌금 내고, 눈에 띌 이유를 더 주지 마. 시간은 대부분의 앙금을 풀어 줘, 가만히 두면.",
    flags: ['chen_authority_advice'],
    choices: [
      {
        text: '좋은 조언이에요. 경고 고마워요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '깨끗하게 지내기 어렵게 만들 때가 있어요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  good_karma_response: {
    text: "듣기 좋네. 섹터엔 그런 사람이 더 필요해. 너무 많은 선장이 자기만 챙기거든. 남을 도우면 소문이 나. 사람들이 당신을 보는 시선이 달라지지.",
    flags: ['chen_good_karma_response'],
    choices: [
      {
        text: '우리 모두 서로를 챙겨야 해요.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '그게 옳은 일 같아요.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  station_gossip: {
    text: (_rep, context) => {
      if (
        context &&
        context.systemsVisited >= ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
      ) {
        return '"엔지니어는 뒤쪽 베이에서 일해. 타나카. 대부분 혼자 지내. 구동 시스템 관련 일을 하는데 난 이해도 못 해." 그녀가 엔지니어링 구역 쪽을 힐끗 본다. "당신은 충분히 돌아다녔으니 정말로 말을 걸어줄지도 몰라. 다음에 도킹할 때 들러 볼 만해."';
      }
      return '"엔지니어는 뒤쪽 베이에서 일해. 타나카. 대부분 혼자 지내. 구동 시스템 관련 일을 하는데 난 이해도 못 해." 그녀가 어깨를 으쓱한다. "아무하고나 얘기하진 않아. 네트워크를 실제로 돌아다녀 봤다는 걸 보여 줘야 상대해 줄 거야. 이해는 가."';
    },
    choices: [
      {
        text: '"명심할게요."',
        next: 'greeting',
      },
      {
        text: '"어떤 구동 시스템이죠?"',
        next: 'greeting',
      },
    ],
  },

  tanaka_gossip: {
    text: `"연구용 물자가 늘 부족해. 전자제품, 의약품, 그런 거. 둘 중 하나를 ${TANAKA_SUPPLY_CONFIG.QUANTITY}단위 가져가면 눈여겨볼 거야." 웨이 첸이 목소리를 낮춘다. "도움을 청하는 타입은 아니지만 거절하지도 않을 거야."`,
    choices: [
      {
        text: '"알아 둘게요. 고마워요."',
        next: 'greeting',
      },
      {
        text: `"${TANAKA_SUPPLY_CONFIG.QUANTITY}단위요? 해낼 수 있어요."`,
        next: 'greeting',
      },
    ],
  },

  tanaka_progress: {
    text: "\"타나카가 당신 이름을 말하고 있어. 마음을 열고 있지만 조심스러워. 계속 연구 물자를 가져다줘, 전자제품이나 의약품. 말은 안 해도 알아봐.\"",
    choices: [
      {
        text: '"계속해 볼게요."',
        next: 'greeting',
      },
      {
        text: '"귀띔 고마워요."',
        next: 'greeting',
      },
    ],
  },
};
