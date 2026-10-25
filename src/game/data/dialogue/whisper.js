/**
 * @fileoverview Whisper Dialogue Tree
 *
 * Information Broker at Sirius A - A mysterious information broker who deals in secrets
 * and intelligence. Uses formal speech with educated vocabulary and cryptic measured tones.
 * Provides intel discounts and trading tips based on relationship tier.
 *
 * @module dialogue/whisper
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';
import {
  isWantedByAuthorities,
  isKnownToOutlaws,
  isTrustedByAuthorities,
  hasMixedReputation,
  getKarmaFirstImpression,
} from './faction-karma-conditions.js';

/**
 * Whisper Dialogue Tree - Information Broker at Sirius A
 *
 * Character Profile:
 * - Role: Information Broker at Sirius A
 * - Personality: Mysterious, deals in secrets and intelligence
 * - Speech Style: Formal vocabulary, educated terms, cryptic measured tones
 * - Benefits: Intel discounts and trading tips based on relationship tier
 *
 * Dialogue Flow:
 * - greeting → intel_business → (intel_details | intel_prices) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const WHISPER_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error('Whisper dialogue: reputation must be a number');
      }

      let baseText;
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText = "기다리고 있었습니다. 얘기를 좀 해야겠군요.";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText = '반갑습니다. 흥미로운 게 있습니다.';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText = '아, 낯익은 얼굴이군요. 정보를 찾으십니까?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        baseText = '어서 오세요. 저는 정보를 거래합니다. 무엇이 필요하십니까?';
      } else {
        // Cold or Hostile
        baseText = '정보에는 크레딧이 듭니다.';
      }

      // Add karma-based first impression for new encounters
      if (context && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karmaModifier = getKarmaFirstImpression(context.karma, 'neutral');
        baseText += karmaModifier;
      }

      // Add faction-specific commentary based on player's reputation
      if (context) {
        if (
          isWantedByAuthorities(context) &&
          rep >= REPUTATION_BOUNDS.WARM_MIN
        ) {
          baseText += ' 당국이 당신에게 관심을 갖기 시작했다고 들었습니다.';
        } else if (
          isKnownToOutlaws(context) &&
          rep >= REPUTATION_BOUNDS.WARM_MIN
        ) {
          baseText +=
            " 지하세계에서 흥미로운 인맥을 쌓으셨다는 소문이 있더군요.";
        } else if (
          isTrustedByAuthorities(context) &&
          rep >= REPUTATION_BOUNDS.WARM_MIN
        ) {
          baseText += ' 깨끗한 이력은 특정한 문을 열어 주지요.';
        }
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
              '\n\n*₡500 대출이 연체되었습니다. 즉시 상환이 필요합니다.*';
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*알림: ₡500 대출 상환일이 ${daysRemaining}일 남았습니다.*`;
          } else {
            baseText += `\n\n*미상환 대출: ₡500, ${daysRemaining}일 남았습니다.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '당신의 정보 서비스에 대해 알려 주세요.',
        next: 'intel_business',
      },
      {
        text: '거래 요령이 있나요?',
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
        text: '당국의 순찰 패턴에 대한 정보가 필요해요.',
        next: 'authority_intel',
        condition: (rep, context) => {
          // Available if player is wanted by authorities and has warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            context &&
            isWantedByAuthorities(context)
          );
        },
      },
      {
        text: '무법자 활동에 대한 정보가 있나요?',
        next: 'outlaw_intel',
        condition: (rep, context) => {
          // Available if player is trusted by authorities and has friendly+ reputation
          return (
            rep >= REPUTATION_BOUNDS.FRIENDLY_MIN &&
            context &&
            isTrustedByAuthorities(context)
          );
        },
      },
      {
        text: '온갖 사람들과 거래한다고 들었어요.',
        next: 'mixed_reputation_comment',
        condition: (rep, context) => {
          // Available if player has mixed reputation (high with one faction, low with opposing)
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            context &&
            (hasMixedReputation('authorities', 'outlaws', context) ||
              hasMixedReputation('outlaws', 'authorities', context))
          );
        },
      },
      {
        text: '지금은 없어요. 다음에 봐요.',
        next: null,
      },
    ],
  },

  intel_business: {
    text: '정보는 섹터에서 가장 값진 상품입니다. 시장 상황, 운송 일정, 세관 패턴... 무엇이 언제 어디로 움직이는지 압니다. 제대로 쓰인 지식은 이윤이 됩니다.',
    choices: [
      {
        text: '어떤 정보를 갖고 있죠?',
        next: 'intel_details',
        repGain: 1,
      },
      {
        text: '서비스 비용은 얼마죠?',
        next: 'intel_prices',
      },
      {
        text: '흥미롭네요. 다시 올지도 몰라요.',
        next: 'greeting',
      },
    ],
  },

  intel_details: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return '신뢰하는 고객에겐 사전 경고를 드립니다. 세관 단속, 검문 일정, 집행 패턴. 화물 명세서를... 유연하게 만들어 주는 정보지요.';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return '시장 정보, 운송 명세, 가격 추세. 소문도 듣습니다. 일부는 더 믿을 만하지요. 오랜 고객에게는 더 좋은 출처를 공유합니다.';
      } else {
        return '기본 시장 데이터, 운송 일정, 일반 섹터 뉴스. 표준 정보 패키지입니다. 저와 관계를 쌓으시면 더... 깊은 정보에 접근할 수 있게 됩니다.';
      }
    },
    choices: [
      {
        text: '아주 유용하겠네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '전 직접 정보를 모으는 편이에요.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  intel_prices: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return '가족에게는... 정보가 자유롭게 흐릅니다. 서로의 성공에 대한 투자로 여기십시오.';
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return '신뢰하는 고객은 우대 요율을 받습니다. 표준 가격보다 15% 낮게. 신뢰는 드문 상품이지요. 그에 맞게 보답합니다.';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return '단골 고객은 소폭 할인을 누립니다. 게시 요율보다 10% 낮게. 정보 거래에서도 충성에는 특권이 있지요.';
      } else {
        return '표준 요율이 적용됩니다. 정보에는 크레딧을, 크레딧에는 정보를. 단순한 거래입니다.';
      }
    },
    choices: [
      {
        text: '그럴 법하네요. 서비스가 필요할지도 몰라요.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "명심할게요.",
        next: 'greeting',
      },
    ],
  },

  ask_tip: {
    text: '공유된 지식은 배가된 지식입니다. 관심을 가질 만한 게 있습니다...',
    flags: ['whisper_tip_requested'],
    choices: [
      {
        text: '정보 감사합니다.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '유용하네요. 고맙습니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: '긴급 대출이라... 오백 크레딧은 상당한 금액입니다. 하지만 한번 쌓인 신뢰는 지켜져야 하지요. 삼십 일 안에 상환한다는 전제로 준비해 드릴 수 있습니다.',
    flags: ['whisper_loan_discussed'],
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
        text: '생각해 볼게요.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: '화물 보관... 소중한 고객을 위한 보안 시설을 운영합니다. 열 단위까지, 돌아오실 때까지 안전하게 보관됩니다. 동료 사이의 서비스로 여기십시오.',
    flags: ['whisper_storage_discussed'],
    choices: [
      {
        text: '아주 도움이 되겠어요.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.storeCargo();
        },
      },
      {
        text: '그런 선택지가 있다니 다행이네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: '대출 상환... 네, 기록이 보입니다. 약속대로 오백 크레딧. 의무에 신속히 대응하신 점을 기록하고 감사드립니다.',
    flags: ['whisper_loan_repaid'],
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
    text: '화물 반환... 네, 물품은 안전하게 보관되어 있습니다. 귀하의 배로 옮겨 드리죠. 화물칸이 가득 차 있으면 일부 물품은 보관소에 남아야 할 수 있음을 유념하십시오.',
    flags: ['whisper_cargo_retrieved'],
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

  authority_intel: {
    text: '순찰 패턴... 민감한 정보입니다. 하지만 귀하의 처지라면 필수적일 수 있겠지요. 당국은 예측 가능한 경로를 따릅니다. 효율 때문에 그럴 수밖에 없지요. 아는 걸 공유할 수 있지만 이 정보는 할증이 붙습니다.',
    flags: ['whisper_authority_intel'],
    choices: [
      {
        text: '받을 수 있는 도움은 다 받아야 해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '차라리 조용히 지내는 게 낫겠네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  outlaw_intel: {
    text: '무법자 활동... 깨끗한 이력을 가진 분의 요청이라 흥미롭군요. 당국은 이런 정보에 후한 값을 치를 겁니다. 알려진 밀수 항로와 해적 은신처에 대한 세부 정보를 드릴 수 있지만 신중히 생각하십시오. 이런 지식은 남들이 당신을 보는 시선을 바꿉니다.',
    flags: ['whisper_outlaw_intel'],
    choices: [
      {
        text: '어떤 위협이 있는지 알아야 해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '차라리 모르는 게 안전할지도요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  mixed_reputation_comment: {
    text: '그렇습니다. 정보는 섹터의 모든 구석에서 흘러듭니다. 당신의... 복잡한 평판은 남들에겐 닫힌 문을 열어 줍니다. 누군가는 당신을 친구로, 누군가는 적으로 보지요. 제 사업에서는 그래서 당신이 아주 흥미로운 사람입니다.',
    flags: ['whisper_mixed_reputation'],
    choices: [
      {
        text: '모든 선택지를 열어 두려고 해요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '때로는 편을 정해야 하죠.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '평판도 하나의 도구일 뿐이에요.',
        next: 'greeting',
        repGain: 3,
      },
    ],
  },
};
