/**
 * Captain Vasquez Dialogue Tree
 * Retired Trader at Epsilon Eridani - mentor figure for new traders.
 * @module dialogue/captain-vasquez
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  ENDGAME_CONFIG,
  TANAKA_SUPPLY_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';
import {
  hasGoodKarma,
  hasBadKarma,
  isFriendToCivilians,
  getKarmaFirstImpression,
} from './faction-karma-conditions.js';

/**
 * Captain Vasquez Dialogue Tree - Retired Trader at Epsilon Eridani
 *
 * Character Profile:
 * - Role: Retired Trader at Epsilon Eridani
 * - Personality: Mentor figure for new traders, warm and experienced
 * - Speech Style: Warm vocabulary, simple terms, shares trading stories
 * - Benefits: Valuable trading tips and hints about endgame content (Pavonis route)
 *
 * Dialogue Flow:
 * - greeting → trading_talk → (route_advice | fuel_costs) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → backstory (FRIENDLY_MIN tier) → pavonis_hints → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const CAPTAIN_VASQUEZ_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error(
          'Captain Vasquez dialogue: reputation must be a number'
        );
      }

      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "어서 오게, 한 식구! 와서 앉게. 마침 상인들이 서로 챙기던 옛 시절 생각을 하던 참이었네. 배는 잘 버텨 주나?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "믿음직한 친구! 다시 보니 반갑군. 나도 수십 년 이 항로를 다녔지만 자네는 괜찮은 사람이란 걸 알겠어. 무슨 일로 왔나?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "여, 친구! 동료 상인을 보는 건 언제나 즐겁지. 볼 때마다 자신감이 붙는군. 배는 잘 나가나?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "오, 또 자네군! 아직 항해하고 있다니 반갑네. 장사는 어떤가?";
      } else {
        // Neutral (starts at rep 5, so likely Neutral)
        baseText =
          "어서 오시오, 선장. 난 바스케스요. 나도 한때 이 항성계들에서 화물을 날랐지. 무엇을 도와줄까?";
      }

      // Add karma-based commentary for established relationships
      if (context && rep >= REPUTATION_BOUNDS.WARM_MIN) {
        if (hasGoodKarma(context)) {
          baseText +=
            " 자네는 괜찮은 사람이야. 이 섹터에는 자네 같은 상인이 더 필요하지.";
        } else if (hasBadKarma(context)) {
          baseText +=
            " 이제 눈매가 꽤 날카로워졌군. 이 섹터가 사람을 그렇게 만들지.";
        }
      }

      // Add karma-based first impression for new encounters
      if (context && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karmaModifier = getKarmaFirstImpression(context.karma, 'lawful');
        baseText += karmaModifier;
      }

      // Add civilian faction appreciation
      if (
        context &&
        isFriendToCivilians(context) &&
        rep >= REPUTATION_BOUNDS.WARM_MIN
      ) {
        baseText +=
          " 자네가 사람들을 돕고 다닌다는 소문을 들었네. 내가 기억하는 상인 정신이야.";
      }
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*선장, ₡500 대출이 연체되었네. 설마 깜빡한 거겠지?*';
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*그냥 친절하게 알려 주는 걸세. ₡500 대출 상환일이 ${daysRemaining}일 남았네.*`;
          } else {
            baseText += `\n\n*참, 아직 ₡500을 갚아야 하네. 상환까지 ${daysRemaining}일 남았어.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: '이 섹터의 거래에 대해 알려 주세요.',
        next: 'trading_talk',
      },
      {
        text: '거래 요령이 있을까요?',
        next: 'ask_tip',
        condition: (rep, context) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          return context.canGetTip.available;
        },
      },
      {
        text: '상인 시절 이야기를 들려 주세요.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
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
          // Fall back to reputation-only check if context not available (e.g., in tests)
          if (!context || !context.canRequestStorage) return true;
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
        text: '"유키 타나카가 보낸 메시지가 있어요."',
        next: 'tanaka_message',
        condition: (_rep, context) =>
          context?.getQuestStage?.('tanaka') === 4 &&
          !context?.getQuestState?.('tanaka')?.data?.messageDelivered,
        action: (context) => {
          context.updateQuestData('tanaka', 'messageDelivered', 1);
          return { success: true, message: '메시지를 전했다.' };
        },
      },
      {
        text: '"빚을 청산했어요. 이제 어떻게 하죠?"',
        next: 'debt_cleared_tanaka_hint',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context?.debt === 0 && context?.getQuestStage?.('tanaka') === 0
          );
        },
      },
      {
        text: '"전 아직 여기서 풋내기예요."',
        next: 'explore_more',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context.systemsVisited <
            ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
          );
        },
      },
      {
        text: '"바너드에 흥미로운 사람이 있나요?"',
        next: 'barnards_engineer',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context.systemsVisited >=
            ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
          );
        },
      },
      {
        text: '"바너드에서 그 엔지니어를 만났어요. 거의 말을 안 하더군요."',
        next: 'tanaka_advice',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          return context.getQuestStage('tanaka') === 0;
        },
      },
      {
        text: '"타나카의 신뢰를 얻으려면 어떻게 해야 할까요?"',
        next: 'tanaka_patience',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          const stage = context.getQuestStage('tanaka');
          if (stage < 1 || stage >= 4) return false;
          const nextStage = stage + 1;
          return !context.canStartQuestStage('tanaka', nextStage);
        },
      },
      {
        text: '"타나카가 제가 준비되면 된다고 해요."',
        next: 'pavonis_prep',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          const stage = context.getQuestStage('tanaka');
          if (stage !== 4) return false;
          if (!context.hasClaimedStageRewards?.('tanaka')) return false;
          return !context.canStartQuestStage('tanaka', 5);
        },
      },
      {
        text: '그냥 들러 봤어요. 몸 조심하세요, 선장님.',
        next: null,
      },
      {
        text: '할 수 있을 때 사람들을 도우려고 해요.',
        next: 'good_karma_discussion',
        condition: (rep, context) => {
          // Available if player has good karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            context &&
            hasGoodKarma(context)
          );
        },
      },
      {
        text: '저 바깥에서는 어려운 선택을 해야 할 때가 있죠.',
        next: 'bad_karma_discussion',
        condition: (rep, context) => {
          // Available if player has bad karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN && context && hasBadKarma(context)
          );
        },
      },
    ],
  },

  trading_talk: {
    text: "아, 거래! 은퇴하기 전까지 삼십 년을 했지. 이 섹터는 뼈대가 좋아. 믿을 만한 항로, 꾸준한 수요. 핵심은 각 항성계가 뭘 원하는지 이해하는 거야. 광산 정거장은 언제나 공산품을 원하고, 부유한 항성계는 사치품에 웃돈을 내지.",
    choices: [
      {
        text: '어떤 항로를 추천하세요?',
        next: 'route_advice',
        repGain: 1,
      },
      {
        text: '장거리 항로는 연료비가 비싼 것 같아요.',
        next: 'fuel_costs',
        repGain: 1,
      },
      {
        text: '조언 고맙습니다.',
        next: 'greeting',
      },
    ],
  },

  route_advice: {
    text: "좋은 질문이군! 바너드-프로키온-시리우스 삼각 항로는 초보자에게 탄탄하네. 점프가 짧고 마진도 좋아. 자본이 생기면 태양-알파 센타우리 사치품 항로가 짭짤하지. 하지만 연료를 조심하게. 항성계 사이에 발이 묶이는 것만큼 나쁜 건 없으니.",
    choices: [
      {
        text: '피해야 할 항로가 있나요?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '조언 감사합니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  fuel_costs: {
    text: "말도 말게! 연료는 상인의 영원한 적이야. 내 시절엔 항로를 군사 작전처럼 짰지. 점프마다 계산하고, 화물 한 톤마다 이유를 달았어. 가능할 때 엔진을 업그레이드하게. 효율은 제 값을 하네.",
    choices: [
      {
        text: '수익성 있는 항로는 어떻게 계산하나요?',
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

  ask_tip: {
    text: "물론이지! 동료 상인에게 아는 걸 나누는 건 언제나 즐겁네. 저 바깥에서 도움이 될 만한 걸 하나 알려 주지...",
    flags: ['vasquez_tip_requested'],
    choices: [
      {
        text: '그 정보 정말 도움이 되네요.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '팁 고맙습니다, 선장님.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  backstory: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "알려진 우주에서 삼십 년간 화물을 날랐지. 낡아빠진 운반선으로 시작해 어엿한 화물선까지 올라갔어. 항성계가 피고 지는 걸 봤고 교역로가 변하는 것도 지켜봤지. 하지만 저 바깥엔 아직 미지의 공간이 있어... 파보니스처럼 모험가를 부르는 곳들 말이야.";
      } else {
        return '이 정거장 몇몇이 지어지기도 전부터 이 항로를 다녔다네. 작게 시작해서 열심히 일하고 크레딧 한 푼까지 모았지. 편안하게 은퇴했지만 가끔은 공허의 자유가 그리워. 좋은 항해가 주는 짜릿함, 알지?';
      }
    },
    flags: ['vasquez_backstory_shared'],
    choices: [
      {
        text: '파보니스에 대해 알려 주세요.',
        next: 'pavonis_hints',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
        repGain: 1,
      },
      {
        text: '왜 은퇴하셨어요?',
        next: 'retirement_story',
        repGain: 2,
      },
      {
        text: '대단한 경력이시네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  pavonis_hints: {
    text: "파보니스... 그 이름을 입에 올려 본 지 몇 년 됐군. 알려진 항로 너머에 있네. 희귀 광물이 풍부하다고들 하지만 그 여정은... 시도라도 하려면 항속 연장기가 필요해. 대부분의 상인은 신화라고 생각하지만 난 옛 해도를 봤어. 언젠가 제대로 된 장비와 충분한 용기를 가진 누군가가 그 항해를 해내겠지.",
    flags: ['vasquez_pavonis_discussed'],
    choices: [
      {
        text: '항속 연장기는 어디서 구하죠?',
        next: 'range_extender_hint',
        repGain: 2,
      },
      {
        text: '위험한 여정 같네요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  range_extender_hint: {
    text: "그게 백만 크레딧짜리 질문이지. 항속 연장기는 군사 기술이라 엄격히 제한돼 있네. 하지만 소문은 들었어... 외곽 항성계의 어떤 연줄은 누군가를 아는 누군가를 알지도 몰라. 평판을 쌓고 좋은 친구를 사귀게. 그러면 언젠가 찾던 걸 만날 수도 있지.",
    flags: ['vasquez_range_extender_hint'],
    choices: [
      {
        text: '이 이야기를 해 주셔서 감사합니다.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "명심할게요.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  retirement_story: {
    text: "주로 나이야. 반사신경이 느려지는데 우주는 실수를 봐주지 않거든. 게다가 편히 살 만큼은 모아 뒀고. 하지만 진짜 이유는? 다음 세대 상인들을 돕고 싶었어. 내가 배운 걸 나누고, 내가 저지른 실수에서 몇 명이라도 구해 주고 싶었지.",
    choices: [
      {
        text: '어떤 실수를 피해야 하죠?',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "정말 너그러우시네요.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  request_loan: {
    text: "긴급 대출? 나도 자네 같은 처지였던 적이 있지. 가끔 공허가 변화구를 던져서 도움이 필요해질 때가 있어. 오백 크레딧, 삼십 일 안에 갚는 조건이네. 자네를 믿으니까 이 얘기를 하는 거지.",
    flags: ['vasquez_loan_discussed'],
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
    text: "화물 보관? 물론이지! 허브에 안전한 공간이 있네. 열 단위까지, 자네가 돌아올 때까지 안전하게 보관해 주지. 상인끼리의 호의로 여기게. 이 바닥에선 서로 챙기는 거야.",
    flags: ['vasquez_storage_discussed'],
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
        text: '제안 감사합니다.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "대출 상환? 물론이지! *기록을 확인한다* 오백 크레딧, 딱 기한에 맞췄군. 약속을 지키는 상인이 좋아. 그게 이 장사를 신뢰로 돌아가게 하니까.",
    flags: ['vasquez_loan_repaid'],
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
        text: '크레딧을 마련하려면 시간이 좀 더 필요해요.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "화물을 찾겠다고? 물론이지! *보관 기록을 확인한다* 자네 물건은 안전하게 있네. 자네 배로 옮겨 주지. 화물칸이 가득 차 가면 알려 주게. 어떻게든 해결해 보세.",
    flags: ['vasquez_cargo_retrieved'],
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
        text: '먼저 공간을 좀 비울게요.',
        next: 'greeting',
      },
    ],
  },

  good_karma_discussion: {
    text: "그게 내가 듣고 싶은 정신이야! 내 시절엔 상인들이 서로를 챙겼지. 남을 돕는 게 좋은 장사일 뿐 아니라 옳은 일이라는 걸 알았거든. 자네 같은 사람이 저 바깥에 있으면 섹터가 더 나은 곳이 되지.",
    flags: ['vasquez_good_karma_discussion'],
    choices: [
      {
        text: '우리 모두 뭉쳐야죠.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '할 수 있을 때 돕는 게 그냥 옳다고 느껴져요.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  bad_karma_discussion: {
    text: "눈에 짐이 무겁게 실려 있는 게 보이는군, 선장. 섹터는 잔인할 수 있고, 때로는 원치 않던 구석으로 몰아넣기도 하지. 살아남으려고 나쁜 선택을 한 좋은 상인도 봤어. 중요한 건 자기가 어떤 사람이 되고 싶은지 잊지 않는 거야.",
    flags: ['vasquez_bad_karma_discussion'],
    choices: [
      {
        text: '살아남으려면 해야 할 일을 하는 거예요.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "더 잘하고 싶지만 늘 쉽지는 않아요.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '때로는 좋은 선택지가 없어요.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  tanaka_message: {
    text: '바스케스가 메시지를 천천히 읽는다. 표정이 변한다. 슬픔과 이해 사이 어딘가다. "그때 타나카를 알았지. 그녀의 언니가 떠나기 전에. 전해 주게... 포기하지 않아서 기쁘다고."',
    choices: [{ text: '고개를 끄덕이고 자리를 뜬다.', next: null }],
  },

  explore_more: {
    text: '"아직 풋내기군. 항성계를 몇 곳 더 겪어 보고 네트워크가 어떻게 흐르는지 보게. 흥미로운 사람들이 저 바깥에 있지만 그들은 자네가 실력을 증명하길 먼저 보고 싶어 해."',
    choices: [
      {
        text: '"추천할 만한 항성계가 있나요?"',
        next: 'route_advice',
        repGain: 1,
      },
      {
        text: '"가 볼게요."',
        next: 'greeting',
      },
    ],
  },

  barnards_engineer: {
    text: "\"자네 배, 타나카 마크 III 구동계 아닌가? 설계자의 딸이 바너드에서 일한다더군. 타나카라는 엔지니어인데 구동계 개조 같은 걸 하지.\" 그가 몸을 기울인다. \"그런 엔지니어는 길가에 널려 있지 않아. 인사해 둘 만하네.\"",
    choices: [
      {
        text: "\"다음에 바너드에 가면 찾아볼게요.\"",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"팁 고맙습니다, 선장님."',
        next: 'greeting',
      },
    ],
  },

  debt_cleared_tanaka_hint: {
    text: "빚을 청산했다고? 여기선 작은 일이 아니지. 잘 듣게, 만나 봐야 할 사람이 있네. 바너드 항성의 타나카라는 엔지니어야. 실험용 점프 구동계를 작업 중인데 믿을 만한 조종사가 필요하대. 자네는 깨끗한 몸이니 그녀가 찾는 딱 그런 사람이지.",
    flags: ['vasquez_tanaka_hint_given'],
    choices: [
      {
        text: '"흥미롭네요. 가 볼게요."',
        next: null,
        repGain: 1,
      },
      {
        text: '"왜 그녀가 제 도움을 원한다고 생각하세요?"',
        next: 'tanaka_recommendation',
      },
      {
        text: '"고맙습니다, 선장님. 생각해 볼게요."',
        next: null,
      },
    ],
  },

  tanaka_recommendation: {
    text: "자네가 나는 걸 지켜봤으니까. 나타나고, 배달하고, 사람을 제대로 대하지. 여기선 그게 자격증보다 중요해. 타나카는 쉽게 믿지 않지만 그녀에게 필요한 걸, 전자제품이나 의약품을 가져다주면 마음을 열 거야. 인내심을 가지게.",
    choices: [
      {
        text: '"믿어 주셔서 고맙습니다."',
        next: null,
        repGain: 2,
      },
      {
        text: '"가능할 때 바너드로 갈게요."',
        next: null,
        repGain: 1,
      },
    ],
  },

  tanaka_advice: {
    text: `"타나카? 그래, 신뢰를 공짜로 주는 사람이 아니지. 연구 물자를 가져다주게. 전자제품이나 의약품을 한 번에 ${TANAKA_SUPPLY_CONFIG.QUANTITY}단위씩." 그가 바를 톡톡 두드린다. "꾸준히 나타나. 자네가 진지하다는 걸 보면 마음을 열 거야."`,
    choices: [
      {
        text: '"도움이 되네요. 고맙습니다, 선장님."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"계속 물자를 가져다줄게요."',
        next: 'greeting',
      },
    ],
  },

  tanaka_patience: {
    text: '"타나카 같은 사람의 신뢰를 얻는 건 시간이 걸리네. 계속 찾아가고 연구를 계속 도와주게. 가능할 때 물자를, 전자제품이나 의약품을 가져가고. 고집 센 사람들은 그렇게 하는 거야."',
    choices: [
      {
        text: '"인내심은 제 장기가 아니지만 알겠어요."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"계속해 볼게요."',
        next: 'greeting',
      },
    ],
  },

  pavonis_prep: {
    text: '"그녀는 자네가 준비되면 된다고 하네. 하지만 그런 항해는 배를 최상으로 만들어야 해. 선체는 튼튼하게, 엔진은 거의 완벽하게, 연료와 물자를 댈 크레딧이 충분하게, 그리고 빚도 없어야지. 먼저 자네 사정부터 정리하게."',
    choices: [
      {
        text: '"모든 걸 정리해 둘게요."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"크레딧이 얼마나 필요한가요?"',
        next: 'pavonis_prep_credits',
      },
    ],
  },

  pavonis_prep_credits: {
    text: '"최소 이만오천. 연료와 물자, 그리고 예상 밖의 일에 대비한 여유분이지. 게다가 배가 빚이 없어야 해. 빚진 채로 공허로 날아가게 둘 대출업자는 없으니."',
    choices: [
      {
        text: '"큰 돈이네요. 거래를 열심히 해야겠어요."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"알겠어요. 고맙습니다, 선장님."',
        next: 'greeting',
      },
    ],
  },
};
