import { REPUTATION_BOUNDS } from '../constants.js';

const EPILOGUE_CONFIG = {
  sections: [
    {
      id: 'arrival',
      variants: [
        {
          condition: null,
          text: '델타 파보니스가 시야를 가득 채운다. 태양보다 따뜻한 주황빛 태양, 불가능한 거리에도 어쩐지 반겨 주는 듯하다. 항속 연장기가 덜컥거리다 멈춘다. 단 하나의 목적을 다했다. 당신이 알던 모든 것에서 이십 광년 떨어져 있다.',
        },
      ],
    },
    {
      id: 'tanaka',
      variants: [
        {
          condition: {
            npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.FAMILY_MIN],
          },
          text: '통신으로 타나카의 목소리가 변함없이 침착하게 들린다. "해냈어요." 침묵. 그녀에게서 들은 가장 긴 침묵이다. "고마워요. 모든 것에." 그녀가 결코 보여 주지 않을 미소가 들린다.',
        },
        {
          condition: {
            npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.TRUSTED_MIN],
          },
          text: '"점프 성공 확인." 엔지니어링 베이에서 타나카가 보고한다. 여느 때처럼 프로답다. 하지만 돌아보니 그녀는 눈물을 머금은 채 창밖을 보고 있다. "내 언니가 저 아래 어딘가에 있어요."',
        },
      ],
    },
    {
      id: 'reputation',
      variants: [
        {
          condition: { karmaAbove: 50, trustedNPCs: 3 },
          text: "소문은 태양에서 20광년 떨어진 곳에서도 빠르게 퍼진다. 네트워크는 당신을 기억한다. 약속을 지키고 중요한 순간에 도운 상인으로. 당신은 잊히지 않는다.",
        },
        {
          condition: { karmaBelow: -50 },
          text: "해냈다. 그게 중요하다. 네트워크는 당신 없이도 돌아간다. 배는 도킹하고 출항한다. 상인은 오가고 당신의 이름은 흐려진다. 하지만 당신은 여기 있다. 자유롭다. 그걸로 충분하다.",
        },
        {
          condition: null,
          text: "네트워크는 당신 없이 이어진다. 누군가는 당신의 이름을 기억하고 누군가는 기억하지 못한다. 하지만 당신은 공허를 건넜다. 불가능한 항해를 해냈다. 그건 누구도 앗아갈 수 없다.",
        },
      ],
    },
    {
      id: 'reflection',
      variants: [
        {
          condition: { karmaAbove: 30 },
          text: '당신은 대체로 더 어려운 길을 택했다. 외면할 수 있을 때 도왔다. 빼앗을 수 있을 때 베풀었다. 델타 파보니스는 단지 닿은 곳이 아니라 얻어 낸 곳처럼 느껴진다.',
        },
        {
          condition: { karmaBelow: -30 },
          text: "당신은 살아남았다. 별 사이의 공허에서 생존은 그 자체로 도덕이다. 당신이 한 모든 선택이 계속 날게 했다. 그리고 이제 누구도 가능하다고 생각하지 못한 만큼 멀리 날았다.",
        },
        {
          condition: null,
          text: "성자도 악당도 아닌, 해야 할 일을 한 화물선 선장일 뿐. 별은 당신을 기억하지 않는다. 그 사이에 있는 사람들은 기억할지도 모른다. 그리고 이제 머리 위엔 새로운 별이 있다.",
        },
      ],
    },
  ],
};

export function generateEpilogue(gameState) {
  const sections = [];

  for (const section of EPILOGUE_CONFIG.sections) {
    for (const variant of section.variants) {
      if (evaluateEpilogueCondition(variant.condition, gameState)) {
        sections.push({ id: section.id, text: variant.text });
        break;
      }
    }
  }

  return sections;
}

function evaluateEpilogueCondition(condition, gameState) {
  if (!condition) return true;

  if (condition.npcRep) {
    const [npcId, threshold] = condition.npcRep;
    if ((gameState.npcs[npcId]?.rep ?? 0) < threshold) return false;
  }

  if (condition.karmaAbove != null) {
    if (gameState.player.karma <= condition.karmaAbove) return false;
  }

  if (condition.karmaBelow != null) {
    if (gameState.player.karma >= condition.karmaBelow) return false;
  }

  if (condition.trustedNPCs != null) {
    const count = Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length;
    if (count < condition.trustedNPCs) return false;
  }

  return true;
}

export function generateStats(gameState) {
  return {
    daysElapsed: gameState.player.daysElapsed,
    systemsVisited: gameState.world.visitedSystems.length,
    creditsEarned: gameState.stats?.creditsEarned ?? 0,
    missionsCompleted: gameState.missions.completed.length,
    trustedNPCs: Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length,
    cargoHauled: gameState.stats?.cargoHauled ?? 0,
    jumpsCompleted: gameState.stats?.jumpsCompleted ?? 0,
  };
}
