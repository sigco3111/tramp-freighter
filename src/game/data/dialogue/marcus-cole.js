/**
 * @fileoverview Marcus Cole Dialogue Tree
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * Greeting text varies by heat tier (debt pressure level):
 * - Low (0-20): Professional, brief. Financial tips available.
 * - Medium (21-45): Curt. Mentions patterns. Warns about terms.
 * - High (46-70): Threatening. References consequences. Offers a job.
 * - Critical (71-100): Cold fury. Mandatory mission delivery.
 *
 * @module dialogue/marcus-cole
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

/**
 * Safely retrieves the heat tier from the context object.
 * Returns 'low' if the context is unavailable or lacks heat data.
 *
 * @param {Object} context - Dialogue context object
 * @param {string} context.heat - Heat tier value
 * @returns {string} Heat tier: 'low', 'medium', 'high', or 'critical'
 */
function safeGetHeatTier(context) {
  if (context && context.heat) {
    return context.heat;
  }
  return 'low';
}

/**
 * Returns the heat-tier-appropriate greeting text.
 * Falls back to reputation-based variants within each tier.
 *
 * @param {number} rep - Current reputation with Cole
 * @param {Object} context - Dialogue context object
 * @returns {string} Greeting text
 */
function getGreetingText(rep, context) {
  if (context?.debt === 0) {
    return "놀랍군. 대부분은 여기까지 오지 못하는데. 자네 계정이 0이야. 자네에게 그럴 능력이 있을 줄은 몰랐지.";
  }

  const heatTier = safeGetHeatTier(context);

  switch (heatTier) {
    case 'critical':
      return '내가 왜 여기 있는지 알 걸세. 더는 장난도, 변명도 없네. 내 말대로 하게. 아니면 다른 방법으로 내 투자를 회수하겠네. 앉게.';

    case 'high':
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "시간이 얼마 남지 않았네. 나는 참을성 있게 기다렸지. 아주 오래. 하지만 인내에는 대가가 있고 자네의 대가가 다가오고 있네. 자네에게 맡길 일이 있네.";
      }
      return '경고했지. 경고했는데 자네는 듣지 않았어. 이제 내 방식대로 하네. 자네에게 맡길 일이 있고, 자네는 그걸 받을 걸세.';

    case 'medium':
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "자네 숫자를 지켜봤네. 가능성은 보이지만 부채 추이가 마음에 걸리는군. 내가 조건을 조정하게 만들지 말게.";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "자네 계정에 어떤 패턴이 보이네. 내가 좋아하는 패턴이 아니야. 상환 일정을 논의해야겠네.";
      }
      return '자네 계정이 나쁜 방향으로 가고 있네. 나는 이런 걸 알아차리지. 모든 걸 알아차려. 자네의 의무에 대해 이야기해야겠네.';

    case 'low':
    default:
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return '아, 가장 믿음직한 고객이로군. 계정은 정상이네. 오늘은 무엇을 도와줄까?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "시간을 잘 지키는군. 채무자에게선 그게 마음에 들지. 내 사무실엔 무슨 일로 왔나?";
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return '자네 부채는 여전히 남아 있네. 좋은 소식을 가져왔길 바라네.';
      }
      return '여기에 얼굴을 내밀다니 배짱이 대단하군. 지불에 관한 일이어야 할 걸세.';
  }
}

/**
 * Marcus Cole Dialogue Tree - Loan Shark at Sol
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * Dialogue Flow:
 * - greeting → debt_cleared (debt=0, tanaka stage=0) → tanaka_detail → tanaka_motive
 * - greeting → debt_cleared → future_business
 * - greeting → debt_talk → (payment_plan | defiant_response) → greeting
 * - greeting → business (NEUTRAL_MIN tier) → business_details → greeting
 * - greeting → cole_threat (high heat) → (comply | refuse_job) → greeting
 * - greeting → cole_demand (critical heat) → comply_demand → greeting
 */
export const MARCUS_COLE_DIALOGUE = {
  greeting: {
    text: (rep, context) => getGreetingText(rep, context),
    choices: [
      {
        text: '내 시간을 쓸 만한 무언가가 있다고 했나?',
        next: 'debt_cleared',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context?.debt === 0 && context?.getQuestStage?.('tanaka') === 0
          );
        },
      },
      {
        text: '제 빚에 대해서요...',
        next: 'debt_talk',
        condition: (_rep, context) => context?.debt > 0,
      },
      {
        text: '금융 조언이 있나요?',
        next: 'ask_tip',
        condition: (rep, context) => {
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const heatTier = safeGetHeatTier(context);
          if (heatTier !== 'low') return false;
          return context.canGetTip.available;
        },
      },
      {
        text: '사업 기회에 대해 이야기하고 싶었어요.',
        next: 'business',
        condition: (rep, context) => {
          if (rep < REPUTATION_BOUNDS.NEUTRAL_MIN) return false;
          const heatTier = safeGetHeatTier(context);
          return heatTier === 'low' || heatTier === 'medium';
        },
      },
      {
        text: '어떤 일인가요?',
        next: 'cole_threat',
        condition: (_rep, context) => {
          const heatTier = safeGetHeatTier(context);
          return heatTier === 'high';
        },
      },
      {
        text: "듣고 있어요.",
        next: 'cole_demand',
        condition: (_rep, context) => {
          const heatTier = safeGetHeatTier(context);
          return heatTier === 'critical';
        },
      },
      {
        text: "그냥 들렀어요. 이만 가 볼게요.",
        next: null,
      },
    ],
  },

  debt_talk: {
    text: (rep, context) => {
      const heatTier = safeGetHeatTier(context);

      if (heatTier === 'critical') {
        return '자네 부채는 더 이상 협상 주제가 아니네. 사실이지. 그리고 사실에는 결과가 따르네. 문제는 그 결과가 자네에게 유리하게 작용하느냐, 불리하게 작용하느냐뿐이지.';
      }
      if (heatTier === 'high') {
        if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
          return '자네 잔액은 늘어나는데 상환은 정체되어 있네. 나는 충분히 공정했네. 내 침착함을 나약함으로 착각하지 말게.';
        }
        return '자네 잔액은 늘어나네. 상환은 그렇지 않고. 나는 충분히 공정했네. 내 침착함을 나약함으로 착각하지 말게.';
      }
      if (heatTier === 'medium') {
        return '서명할 때 조건은 분명했네. 이자는 붙고, 상환은 기대되네. 그에 맞춰 우선순위를 두길 권하네.';
      }
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return '자네 계정은 정상이네. 조건은 합의대로 유지되네. 정기적으로 상환하면 문제는 없을 걸세.';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return '만 크레딧. 이자 포함. 서명할 때 조건은 분명했네. 정기적인 상환을 기대하네. 연체는... 권하지 않네.';
      }
      return '자네 부채는 막대하고 상환 이력은 부실하네. 이를 최우선으로 삼길 권하네. 나는 참을성 있는 사람이 아니네.';
    },
    choices: [
      {
        text: '지불할 시간이 더 필요해요.',
        next: 'payment_plan',
        repGain: -1,
        condition: (_rep, context) => {
          const heatTier = safeGetHeatTier(context);
          return heatTier !== 'critical';
        },
      },
      {
        text: "가능할 때 갚을게요. 협박하지 마세요.",
        next: 'defiant_response',
        repGain: -5,
      },
      {
        text: "알겠어요. 해결하는 중이에요.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  payment_plan: {
    text: "시간은 돈이네. 내 돈. 하지만 나도 억지를 부리는 사람은 아니야. 계속 거래하게. 정기적으로 갚게. 진전을 보이게. 성의를 보이는 사람에겐 인내할 수 있네.",
    choices: [
      {
        text: '이해해 주셔서 감사해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "최선을 다할게요.",
        next: 'greeting',
      },
    ],
  },

  defiant_response: {
    text: (rep, context) => {
      const heatTier = safeGetHeatTier(context);

      if (heatTier === 'critical' || heatTier === 'high') {
        return '반항이라. 신선하군. 그리고 어리석지. 장부를 쥔 사람이 누군지 잊은 모양이군. 전화 한 통이면 섹터의 모든 정거장이 자네 계정을 동결하네. 다음 말을 아주 신중하게 고르게.';
      }
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return '협박? 난 사실을 다루네. 사실 하나: 자네는 내게 돈을 빚졌다. 사실 둘: 내겐 자네에게 없는 자원이 있다. 사실 셋: 대립보다 협력이 우리 둘 모두에게 낫다. 자네 처지를 신중히 생각하게.';
      }
      return '협박? 자네가? 나는 자네가 평생 가질 돈과 연줄보다 더 많은 걸 가진 자들도 파멸시켰네. 협력만이 자네의 유일한 현실적 선택이지. 신중히 생각하게.';
    },
    choices: [
      {
        text: "맞아요. 사과드립니다.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "기억해 둘게요.",
        next: 'greeting',
      },
    ],
  },

  business: {
    text: '사업. 그래. 직설적인 건 마음에 드는군. 나는 섹터 전역에 연줄이 있네. 정보. 기회. 적절한 고객에게는... 안내를 해 줄 수 있지.',
    choices: [
      {
        text: '어떤 기회인가요?',
        next: 'business_details',
        repGain: 1,
      },
      {
        text: '다음에 하죠.',
        next: 'greeting',
      },
    ],
  },

  business_details: {
    text: '시장 정보. 화물 명세. 운송 일정. 지식은 제대로 쓰면 이윤이네. 물론 그런 서비스에는 신뢰가 필요하지. 그리고 신뢰는 얻어야 하는 것이고.',
    choices: [
      {
        text: '그 신뢰를 어떻게 얻죠?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "명심할게요.",
        next: 'greeting',
      },
    ],
  },

  ask_tip: {
    text: "금융 조언? 좋네. 신용 관리는 극소수의 상인만 익히는 기술이지. 부채는 도구네. 잘못된 손에서는 위험하고 제대로 쓰면 강력하지. 자네의 재정 상태를 개선할 만한 걸 알려 주지...",
    flags: ['cole_tip_requested'],
    choices: [
      {
        text: "가치 있는 조언이네요. 감사합니다.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "생각해 볼게요. 고맙습니다.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  cole_threat: {
    text: '배달이네. 자네 같은... 능력이라면 충분히 간단하지. 소포 하나가 정해진 기한 안에 정해진 목적지에 닿아야 하네. 완수하면 자네 부채를 줄여 주지. 거절하면 자네 처지는 훨씬 불편해질 걸세.',
    choices: [
      {
        text: "그 일 할게요.",
        next: 'comply',
        repGain: 2,
      },
      {
        text: "전 누구의 심부름도 안 해요.",
        next: 'refuse_job',
        repGain: -5,
      },
      {
        text: '자세한 내용이 뭐죠?',
        next: 'comply',
        repGain: 1,
      },
    ],
  },

  comply: {
    text: '좋아. 현실적인 판단이 어울리는군. 세부 사항은 임무 일지를 확인하게. 기한 내에 온전하게 배달하게. 내용물에 대한 질문은 없네. 우회도 없고. 서로 이해했겠지.',
    choices: [
      {
        text: '알겠습니다.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "배달은 해낼게요.",
        next: null,
      },
    ],
  },

  refuse_job: {
    text: '채권자의 일을 거절한다. 대담하군. 어리석지만 대담해. 제안은 유효하네. 시간이 간다고 나아지진 않지. 자네 계정 잔액도 마찬가지고. 내게 남은 얼마 안 되는 인내가 사라지기 전에 신중히 생각하게.',
    choices: [
      {
        text: '좋아요. 하겠어요.',
        next: 'comply',
        repGain: 1,
      },
      {
        text: '싫다고 했어요.',
        next: null,
        repGain: -3,
      },
    ],
  },

  cole_demand: {
    text: '이건 부탁이 아니네. 협상도 아니고. 자네는 배달할 소포가 있고, 반드시 배달하게 될 걸세. 목적지와 기한은 협상 불가야. 실패하면 자네 자산 청산을 시작하네. 자네 배부터.',
    choices: [
      {
        text: '알겠어요. 처리할게요.',
        next: 'comply_demand',
        repGain: 1,
      },
      {
        text: '제 배를 가져갈 순 없어요.',
        next: 'comply_demand',
        repGain: -2,
      },
    ],
  },

  comply_demand: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return '자네와 나 사이엔 이력이 있네. 그 이력이 자네에게 아직 선택지가 있는 유일한 이유지. 이 기회를 낭비하지 말게. 임무 일지를 확인하게. 가게.';
      }
      return '나는 자네 부채를 쥐고 있네. 자네 일정도 쥐고 있고. 그 잔액이 0이 될 때까지 자네의 우선순위도 내 것이네. 임무 일지를 확인하게. 이제 내 사무실에서 나가서 해내게.';
    },
    choices: [
      {
        text: '해 놓은 걸로 치세요.',
        next: null,
      },
    ],
  },

  debt_cleared: {
    text: "이제 자네 장부가 깨끗해졌으니 하나 알려 주지. 바너드 항성에서 일하는 엔지니어가 있네. 실험적인 점프 기술이지. 이제 자유로우니 시간을 들일 만할 걸세.",
    choices: [
      {
        text: '그 엔지니어에 대해 더 알려 주세요.',
        next: 'tanaka_detail',
      },
      {
        text: '앞으로 우리 사이에 사업이 있을까요?',
        next: 'future_business',
      },
      {
        text: "좋아. 이제 끝났네.",
        next: null,
      },
    ],
  },

  tanaka_detail: {
    text: "이름은 타나카. 바너드 항성에서 일하네. 어떤 실험적인 점프 구동계 프로젝트에 푹 빠져 있지. 현장 시험을 도울 조종사를 늘 찾고 있어. 인사해 볼 만할 걸세.",
    choices: [
      {
        text: "알아볼게요.",
        next: null,
      },
      {
        text: '왜 이 이야기를 해 주시는 거죠?',
        next: 'tanaka_motive',
      },
    ],
  },

  tanaka_motive: {
    text: '직업적 예우라고 해 두지. 자네는 빚을 갚았네. 그만한 대접이... 어느 정도는 따르는 법이야. 게다가 그녀의 프로젝트가 성공하면 돈 벌 구석이 있지. 나는 늘 속셈이 있네.',
    choices: [
      {
        text: '그렇겠죠. 팁 감사합니다.',
        next: null,
      },
    ],
  },

  future_business: {
    text: "어쩌면. 자네는 믿을 만하다는 걸 보여 줬네. 내 업계에서 그건 가치가 있지. 기회가 생기면 자네가 어디 있는지 알겠지.",
    choices: [
      {
        text: "명심할게요.",
        next: null,
      },
      {
        text: "사양할게요.",
        next: null,
        repGain: -2,
      },
    ],
  },
};
