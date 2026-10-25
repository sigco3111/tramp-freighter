/**
 * @fileoverview Father Okonkwo Dialogue Tree
 *
 * Station chaplain and medic who serves travelers' spiritual and physical needs.
 * Uses warm speech with educated vocabulary and religious metaphors.
 *
 * @module dialogue/father-okonkwo
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

/**
 * Father Okonkwo Dialogue Tree - Chaplain at Ross 154
 *
 * Station chaplain and medic who serves travelers' spiritual and physical needs.
 * Uses warm speech with educated vocabulary and religious metaphors.
 *
 * Dialogue Flow:
 * - greeting → faith_talk → (agree | skeptical) → greeting
 * - greeting → help (WARM_MIN tier) → help_details → greeting
 */
export const FATHER_OKONKWO_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return '나의 소중한 벗이여! 그대가 오니 이 정거장에 빛이 드는군요. 오늘은 무엇을 도와드릴까요? 몸과 영혼은 평안하신가요?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "어서 오세요, 아이여. 무사한 모습을 보니 마음이 놓이는군요. 별 사이의 공허는 외로울 수 있지요. 이곳은 언제나 환영합니다.";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return '평화가 함께하기를, 여행자여. 여정에 지쳐 보이는군요. 잠시 쉬어 가세요. 무엇을 도와드릴까요?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return '길 잃은 자도 이곳에서는 환영받습니다. 어떤 짐을 지고 있든 구원의 희망은 언제나 있습니다.';
      } else {
        return '눈에 고통이 보이는군요, 아이여. 이곳은 치유의 장소입니다. 어떤 어둠이 따라와도 이곳에는 들어오지 못합니다.';
      }
    },
    choices: [
      {
        text: '신앙에 대해 말씀해 주세요.',
        next: 'faith_talk',
      },
      {
        text: '도움이 좀 필요해요.',
        next: 'help',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: '지나가는 길이에요. 감사합니다.',
        next: null,
      },
    ],
  },

  faith_talk: {
    text: "신앙은 항법과 같습니다, 아이여. 별 사이의 어둠에서 길을 잃으면 집으로 이끌어 줄 무언가가 필요하지요. 누군가에겐 계기와 해도이고, 누군가에겐 마음속의 빛입니다. 둘 다 당신을 무사히 항구로 데려다줄 수 있어요.",
    choices: [
      {
        text: "아름다운 표현이네요.",
        next: 'agree',
        repGain: 3,
      },
      {
        text: '전 계기에 의지하는 편이에요.',
        next: 'skeptical',
        repGain: -1,
      },
      {
        text: "생각해 볼게요.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  agree: {
    text: '지혜가 있군요, 벗이여. 우주는 광대하고 경이로 가득합니다. 행성의 춤에서 의미를 찾든 낯선 이의 친절에서 찾든, 중요한 건 그것을 찾는 것이지요. 연결. 목적. 사랑.',
    choices: [
      {
        text: '그런 관점을 말씀해 주셔서 감사합니다.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '말씀을 참 잘하세요, 신부님.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  skeptical: {
    text: "그것에도 지혜가 있지요, 아이여. 좋은 계기는 생명을 구합니다. 하지만 최고의 항법 컴퓨터도 왜 이 여정이 중요한지는 말해 주지 못해요. 그건 각자의 영혼이 스스로 발견해야 하는 것입니다.",
    choices: [
      {
        text: "그 말씀이 맞을지도 모르겠네요.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '다들 각자의 길을 찾는 거겠죠.',
        next: 'greeting',
      },
    ],
  },

  help: {
    text: '물론이지요, 사랑하는 이여. 이 정거장은 공허를 여행하는 모든 이를 위해 있습니다. 의약품, 영적 상담, 폭풍 속 안전한 항구. 마음에 무엇이 걸려 있나요?',
    choices: [
      {
        text: '어떤 도움을 주실 수 있나요?',
        next: 'help_details',
        repGain: 1,
      },
      {
        text: "여기 계시다는 것만으로도 도움이 돼요.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  help_details: {
    text: '몸을 위한 치료, 영혼을 위한 인도, 때로는 그저 들어 주는 귀. 별 사이의 공허는 차갑지만 인간의 친절은 가장 어두운 여정도 따뜻하게 해 줍니다. 혼자서 문제를 마주할 필요는 없어요.',
    flags: ['okonkwo_help_offered'],
    choices: [
      {
        text: '생각보다 훨씬 큰 의미예요.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "감사합니다, 신부님. 기억할게요.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },
};
