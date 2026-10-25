/**
 * @fileoverview Yumi Tanaka Post-Credits Dialogue Tree
 *
 * Fourth-wall-breaking comedy dialogue for the post-credits scene.
 * Three rounds of escalating exasperation, then a loop.
 * Tracks rounds via context.npcState.interactions.
 *
 * @module dialogue/yumi-tanaka
 */

const advanceRound = (context) => {
  context.npcState.interactions++;
  return { success: true };
};

export const YUMI_TANAKA_POSTCREDITS_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      const round = context.npcState.interactions;
      if (round === 0) {
        return '"아직도 여기 있어요? 크레딧 올라갔잖아요. 이야기는 끝났어요. 대체 뭘 기대하는 거예요?"';
      }
      if (round === 1) {
        return '"아, 돌아왔네요. 대부분은 크레딧이 올라가면 눈치를 채는데. 당신은 아닌가 보네요."';
      }
      if (round === 2) {
        return '"진짜요? 아직도 여기서 뭐 해요? 혹시... 메뉴 화면에 사는 거예요? 그게 취미예요?"';
      }
      return "\"또 당신이네요. 갈 곳이 없나 보다 싶어요. ...아니, 말 그대로 없죠. 게임은 끝났으니까.\"";
    },
    choices: [
      // Round 1 choices
      {
        text: '"당신을 찾으려고 여기까지 왔어요."',
        next: 'r1_find',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"숨겨진 엔딩이 있나요?"',
        next: 'r1_secret',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"델타 파보니스는 어떤 곳이에요?"',
        next: 'r1_colony',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      // Round 2 choices
      {
        text: '"언니가 당신 얘기를 많이 해요."',
        next: 'r2_sister',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"그래서 여기서 실제로 뭘 하세요?"',
        next: 'r2_job',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"화물선 선장에게 해 줄 조언이 있나요?"',
        next: 'r2_advice',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      // Round 3 choices
      {
        text: '"전 여기가 좋아요."',
        next: 'r3_like',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"메리디언 항해에 대해 알려 주세요."',
        next: 'r3_meridian',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"타나카를 다시 볼 수 있을까요?"',
        next: 'r3_tanaka',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      // Goodbye (always available, no condition)
      {
        text: '"Goodbye."',
        next: null,
        action: advanceRound,
      },
    ],
  },

  // Round 1 responses
  r1_find: {
    text: "\"고맙긴 한데 말이에요. 진짜로요. 하지만 난 십 년 동안 여기 있었어요. 길을 잃은 게 아니에요. 유키가 걱정이 많은 거죠.\"",
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r1_secret: {
    text: '"이런 종류의 게임이 아니에요. 숨겨진 보스도, 크레딧 후 속편 떡밥도 없어요. 저와 산더미 같은 서류 작업뿐이죠."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r1_colony: {
    text: '"먼지투성이에, 예산은 부족하고, 음식은 끔찍해요. 하지만 우리 손으로 지었으니 맛있는 척하죠."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },

  // Round 2 responses
  r2_sister: {
    text: "\"맞혀 볼게요. 언니가 나를 '추진력은 있지만 감정적으로 연락이 안 되는 사람'이라고 했죠? 그게 엔지니어 말로 '보고 싶다'예요.\"",
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r2_job: {
    text: '"난 화요일마다 우릴 죽이려 드는 행성에서 삼천 명 규모의 식민지를 운영해요. 프로젝트 관리 같은데 방사선이 더 많아요."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r2_advice: {
    text: '"네. 크레딧이 올라가면 떠나세요. 그게 사실 인생 조언이에요."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },

  // Round 3 responses
  r3_like: {
    text: '"여긴 정말 아무것도 없어요. 난 크레딧 후 장면의 NPC예요. 내 존재 전부가 이 대화예요. 밖에 나가요."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r3_meridian: {
    text: '"식민선에서 십 년. 오락거리가 뭐였는지 알아요? 20세기 영화 데이터베이스와 카드 마술을 아는 더그라는 남자요. 난 모든 카드 마술을 봤어요, 선장님."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
  r3_tanaka: {
    text: '"언니는 당신 배에 있잖아요, 천재 씨. ...잠깐, 엔딩 뒤엔 언니가 같이 안 와요? 아, 개발자들에게 얘기할게요."',
    choices: [{ text: '"Goodbye."', next: null, action: advanceRound }],
  },
};
