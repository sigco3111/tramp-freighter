import { REPUTATION_BOUNDS, ENDGAME_CONFIG } from '../../constants.js';
import { SeededRandom } from '../../utils/seeded-random.js';

function getRequirementHint(context, nextStage) {
  const unmet = context.getUnmetRequirements('tanaka', nextStage);
  if (unmet.includes('engine'))
    return '"구동계가 거칠게 돌아가네요. 그런 상태의 엔진에는 내 펌웨어를 믿고 맡기지 못하겠어요." 그녀가 당신의 배를 힐끗 본다. "손봐 오세요. 그러면 얘기하죠."';
  if (unmet.includes('hull'))
    return '"선체가 많이 두들겨 맞았네요. 다음 단계를 얘기하기 전에 그것부터 때우세요." 그녀가 당신 배 장갑의 찌그러진 곳을 손으로 쓸어 본다.';
  if (unmet.includes('debt'))
    return '"아직 콜의 주머니 속이군요. 그것부터 해결하세요." 그녀가 팔짱을 낀다. "줄이 달린 사람과는 일하지 않아요."';
  if (unmet.includes('credits'))
    return `"내가 생각하는 건 싸지 않아요. 진행하려면 최소 ${ENDGAME_CONFIG.VICTORY_CREDITS.toLocaleString()} 크레딧이 필요해요." 그녀가 당신의 배를 힐끗 본다. "계속 거래하세요."`;
  if (unmet.includes('rep'))
    return '"당신이 마음에 들어요, 선장. 하지만 다음 단계를 하기엔 아직 당신을 잘 몰라요." 그녀가 다시 작업으로 돌아선다. "계속 들르세요. 물자를 가져오고요. 거기까지 갈 거예요."';
  return null;
}

export const YUKI_TANAKA_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      if (!context) {
        return '타나카가 당신 쪽으로 고개를 끄덕인다.';
      }

      const stage = context.getQuestStage('tanaka');

      // Hint when between stages: rewards claimed but can't start next
      if (stage >= 1 && stage < 5 && context.hasClaimedStageRewards('tanaka')) {
        const nextStage = stage + 1;
        if (!context.canStartQuestStage('tanaka', nextStage)) {
          const hint = getRequirementHint(context, nextStage);
          if (hint) return hint;
        }
      }

      if (stage >= 5) {
        return '"모든 게 준비됐어요. 항속 연장기는 보정이 끝났고, 당신의 배도 준비됐어요." 그녀가 당신의 눈을 마주 본다. "당신은요?"';
      }
      if (stage === 4) {
        const delivered =
          context.getQuestState('tanaka')?.data?.messageDelivered;
        if (delivered) {
          return '"메시지를 전해 줬군요. 고마워요." 목소리는 담담하지만 눈은 더 많은 걸 말한다. "최종 준비를 할 때가 되면 얘기해요."';
        }
        return '"바스케스 선장에게 보내는 내 메시지는 전했나요?" 그녀가 잠깐 당신의 눈을 마주 본다. "에리다니 허브에 있어요. 엡실론 에리다니요."';
      }
      if (stage === 3) {
        return '"시제품 통합이 끝났어요. 당신의 배는 훌륭하게 해냈어요." 그녀가 잠시 멈춘다. "부탁이 하나 더 있어요. 개인적인 거예요."';
      }
      if (stage === 2) {
        const exotics =
          context.getQuestState('tanaka')?.data?.exoticMaterials || 0;
        if (exotics >= ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED) {
          return `"표본 ${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED}개를 전부 찾았군요. 훌륭해요." 그녀가 꼼꼼히 살핀다. "동위원소 비율이 완벽해요. 진행할 수 있어요."`;
        }
        return `"외계 물질 탐색은 계속되고 있어요. 지금까지 표본 ${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED}개 중 ${exotics}개를 찾았어요." 그녀가 계기를 확인한다. "태양에서 ${ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE}광년 너머의 정거장을 계속 뒤지세요."`;
      }
      if (stage === 1) {
        const jumps =
          context.getQuestState('tanaka')?.data?.jumpsCompleted || 0;
        if (jumps >= ENDGAME_CONFIG.STAGE_1_JUMPS) {
          return '"현장 시험 데이터가 훌륭해요. 구동계 개조가 예상 매개변수 안에서 작동하고 있어요." 그녀가 실제로 미소 짓는다. "다른 일이 하나 더 있어요."';
        }
        return `"현장 시험이 진행 중이에요. 구동 고조파를 보정하려면 점프가 ${ENDGAME_CONFIG.STAGE_1_JUMPS - jumps}회 더 필요해요." 그녀가 계측값을 유심히 살핀다.`;
      }

      // Stage 0 with requirements not met for stage 1
      if (stage === 0 && !context.canStartQuestStage('tanaka', 1)) {
        const hint = getRequirementHint(context, 1);
        if (hint) return hint;
      }

      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return '"선장." 짧은 끄덕임. "계속 들러 줘서 고마워요. 할 일이 많아요."';
      }
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return '"당신의 배가 흥미로워요. 타나카 마크 III 구동계는 내 설계 중 괜찮은 편이죠." 그녀가 당신을 살핀다. "어쩌면 서로 도울 수 있겠네요."';
      }
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_HIGH) {
        return '"선장." 그녀가 작업에서 눈을 든다. "계속 물자를 가져오는군요. 아무 대가도 요구하지 않고." 잠시 침묵. "그 믿음직함을 쓸 데가 있을지도 모르겠어요."';
      }
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MID) {
        return '"또 당신이군요." 그녀는 고개를 들지 않지만 돌아서지도 않는다. "당신의 배달은... 충분했어요."';
      }
      return '"타나카. 엔지니어예요." 그녀가 손을 내밀었다가 거둔다. "할 일이 있어요. 용건이 없다면요?"';
    },

    choices: [
      {
        text: '"파보니스 비행 준비됐어요."',
        next: 'pavonis_ready',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 5 &&
          context.canStartQuestStage('tanaka', 5),
      },
      {
        text: '"최종 준비에 대해 알려 주세요."',
        next: 'mission_5_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 4 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 5),
      },
      {
        text: '"바스케스는 이해했어요. 알아서 처리할 거예요."',
        next: 'mission_4_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 4 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"그 개인적인 부탁 말인데요..."',
        next: 'mission_4_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 3 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 4),
      },
      {
        text: '"당신 솜씨가 인상적이에요, 타나카. 배가 다르게 느껴져요."',
        next: 'mission_3_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 3 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"시제품 설치 준비됐어요."',
        next: 'mission_3_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 2 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 3),
      },
      {
        text: '"찾느라 고생했지만 그럴 가치가 있었어요."',
        next: 'mission_2_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 2 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"뭐가 필요하세요?"',
        next: 'mission_2_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 1 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 2),
      },
      {
        text: '"데이터가 잘 나와서 다행이에요. 배가 거기서 잘 움직였어요."',
        next: 'mission_1_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 1 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"현장 시험이 필요하다고 하셨죠?"',
        next: 'mission_1_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 0 &&
          context.canStartQuestStage('tanaka', 1),
      },
      {
        text: '"당신의 연구에 쓸 물자를 가져왔어요."',
        next: 'research_supply',
        condition: (_rep, context) =>
          context &&
          typeof context.canContributeSupply === 'function' &&
          context.canContributeSupply(),
      },
      {
        text: '당신의 연구에 대해 알려 주세요.',
        next: 'about_work',
      },
      {
        text: '당신에 대해 알려 주세요.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: '만나서 반가웠어요. 몸 조심하세요.',
        next: null,
      },
    ],
  },

  about_work: {
    text: '"나는 구동 시스템을 설계해요. 아버지가 원조 타나카 구동계를 만드셨죠. 당신 배에 있는 그거요. 나는 개량 작업을 해 왔어요. 구체적으로는 웜홀 네트워크 너머로 배를 보낼 수 있는 항속 연장기예요." 그녀가 말을 멈춘다. "훨씬 더 멀리요."',
    choices: [
      {
        text: '"얼마나 멀리요?"',
        next: 'range_extender',
        repGain: 1,
      },
      {
        text: '"야심차게 들리네요."',
        next: 'greeting',
      },
    ],
  },

  range_extender: {
    text: '"델타 파보니스. 태양에서 19.89광년. 웜홀 연결은 없어요. 식민선들도 거기까지 기어가는 데 수년이 걸렸죠. 한 번에 점프한 사람은 아무도 없어요." 그녀의 눈이 빛난다. 그녀에게서 본 유일한 감정의 징후다. "항속 연장기가 그걸 가능하게 해요. 한 번의 점프. 편도로요."',
    choices: [
      {
        text: '"왜 델타 파보니스죠?"',
        next: 'why_pavonis',
        repGain: 2,
      },
      {
        text: '"편도라고요? 큰 결심이네요."',
        next: 'one_way',
      },
      {
        text: '"흥미롭네요. 이만 가 봐야겠어요."',
        next: null,
      },
    ],
  },

  why_pavonis: {
    text: '"데이터는 거주 가능한 조건을 시사해요. 하지만 그 이상이에요. 내 언니가 거기 갔어요. 십 년 전에 식민선 메리디언호를 타고요. 편도 여행이었죠." 그녀가 시선을 돌린다. "언니를 찾고 싶어요."',
    choices: [
      {
        text: '"언니를 찾길 바라요."',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '"오래된 일이네요. 어쩌면 언니는..."',
        next: 'might_not',
        repGain: -1,
      },
    ],
  },

  might_not: {
    text: '"확률은 알고 있어요." 목소리가 얼음장 같다. "충분히 계산해 봤어요. 내가 이미 아는 걸 나한테 훈계하려 들지 마세요."',
    choices: [
      {
        text: '"미안해요. 그럴 뜻은..."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"그렇군요."',
        next: null,
      },
    ],
  },

  one_way: {
    text: '"네. 항속 연장기는 일회용이에요. 20광년 점프에 필요한 에너지는... 상당해요. 델타 파보니스에 웜홀 기반시설이 없으면 돌아올 방법은 없어요." 그녀가 어깨를 으쓱한다. "아마 없겠죠."',
    choices: [
      {
        text: '"그래도 그 점프를 하시려고요?"',
        next: 'why_pavonis',
        repGain: 1,
      },
      {
        text: '"행운을 빌어요."',
        next: null,
      },
    ],
  },

  backstory: {
    text: '"아버지는 켄지 타나카였어요. 우리 이름을 딴 구동계를 발명하셨죠. 내가 열두 살 때 시험 비행 중 돌아가셨어요." 그녀가 감정 없이 말한다. "나는 아버지의 일을 이어받았어요. 효율을 32% 개선했죠. 하지만 항속 연장기는 내 설계예요."',
    flags: ['tanaka_backstory'],
    choices: [
      {
        text: '"아버지께서 자랑스러워하실 거예요."',
        next: 'proud',
        repGain: 3,
      },
      {
        text: '"언니는 어떻게 되었나요?"',
        next: 'sister',
        repGain: 2,
      },
      {
        text: '"알겠어요. 얘기해 줘서 고마워요."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  proud: {
    text: '그녀가 한참 동안 조용하다. "어쩌면요. 아버지는 감정보다 결과를 중시하셨어요. 나도 마찬가지고요." 하지만 그녀의 표정에는 그렇지 않음을 암시하는 무언가가 있다.',
    choices: [
      {
        text: '"결과도 중요하지만 사람도 중요해요."',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '"이해해요."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  sister: {
    text: '"유미. 세 살 위. 뛰어난 생물학자였어요. 아무에게도 말하지 않고 메리디언 식민 임무에 지원했죠. 쪽지를 남겼어요." 타나카의 턱이 굳는다. "십 년 동안 얘기를 못 했어요. 메리디언에는 태양계로 돌아오는 통신 중계기가 없어요."',
    choices: [
      {
        text: '"그래서 델타 파보니스에 가고 싶은 거군요."',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '"유감이에요."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  mission_1_offer: {
    text: '"내 최신 구동 보정을 현장 시험해 줄 사람이 필요해요. 개조한 펌웨어로 점프 세 번. 당신의 배, 당신의 항로로요. 나는 텔레메트리 데이터만 있으면 돼요." 그녀가 데이터 칩을 들어 보인다. "보수는 천 크레딧과 엔진 완전 복원이에요."',
    choices: [
      {
        text: '"할게요. 점프 세 번, 텔레메트리 데이터."',
        next: 'mission_1_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"지금은 안 돼요. 나중에요."',
        next: 'greeting',
      },
    ],
  },

  mission_1_accepted: {
    text: '"좋아요. 펌웨어는 이미 업로드 중이에요. 평소 항로로 날기만 하면 돼요. 칩이 모든 걸 자동으로 기록할 거예요." 그녀가 작업대로 돌아선다. "점프 세 번. 그다음 돌아오세요."',
    choices: [
      {
        text: '"해 놓은 걸로 치세요."',
        next: null,
      },
    ],
  },

  mission_1_complete: {
    text: '"훌륭한 데이터예요. 고조파 진동이 예측값의 2% 이내예요." 그녀가 텔레메트리를 내려받고 보수를 보낸다. "약속대로 엔진은 완전히 복원했어요."',
    choices: [
      {
        text: '"다음은요?"',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"거래해서 즐거웠어요."',
        next: null,
        repGain: 1,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_2_offer: {
    text: '"항속 연장기에는 외계 물질이 필요해요. 태양에서 15광년 너머의 정거장에서만 발견되는 특정 동위원소요. 표본 다섯 개가 필요해요." 그녀가 스캐너 모듈을 건넨다. "이 물질은 정거장 시장에 무작위로 나타나요. 이 스캐너가 알아봐 줄 거예요."',
    choices: [
      {
        text: '"여행하면서 눈여겨볼게요."',
        next: 'mission_2_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"찾을 게 많겠네요."',
        next: 'greeting',
      },
    ],
  },

  mission_2_accepted: {
    text: '"스캐너는 당신 배의 센서와 연동돼요. 먼 정거장에 도킹하면 쓸 만한 표본이 있을 때 알려 줄 거예요." 그녀가 잠시 멈춘다. "완료 시 보수: 삼천 크레딧과 고급 센서 업그레이드예요."',
    choices: [
      {
        text: '"찾아낼게요."',
        next: null,
      },
    ],
  },

  mission_2_complete: {
    text: '"표본 다섯 개 전부. 동위원소 신호가..." 그녀가 하나씩 꼼꼼히 확인한다. "완벽해요. 이게 항속 연장기 반응 질량의 핵심이 될 거예요." 그녀가 당신 배에 센서 업그레이드를 설치한다. "받을 자격이 있어요."',
    choices: [
      {
        text: '"다음은 뭐죠?"',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_3_offer: {
    text: '"시제품 항속 연장기를 설치할 준비가 됐어요. 당신의 배는 상태가 좋아야 해요. 선체 최소 70%, 엔진 80%요." 그녀가 당신의 배를 가늠하듯 본다. "내가 직접 설치할 거예요. 그다음 시험해요."',
    choices: [
      {
        text: '"설치하세요. 이 구동계가 뭘 할 수 있는지 보죠."',
        next: 'mission_3_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"먼저 배 상태를 더 끌어올려야겠어요."',
        next: 'greeting',
      },
    ],
  },

  mission_3_accepted: {
    text: '"설치 완료. 항속 연장기는 작동 전까지 휴면 상태라 평상시 운항에는 지장 없어요." 그녀가 손을 닦는다. "시험 비행을 하고 오세요. 돌아오면 측정값을 확인해요."',
    choices: [
      {
        text: '"고마워요, 타나카."',
        next: null,
        repGain: 2,
      },
    ],
  },

  mission_3_complete: {
    text: '"모든 측정값 정상. 시제품은 안정적이에요." 그녀가 보수를 보내고 이제는 다르게 당신을 본다. 신뢰에 가까운 무언가로. "필요한 게 하나 더 있어요. 개인적인 거예요."',
    choices: [
      {
        text: '"말해 보세요."',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"들어 볼게요."',
        next: 'greeting',
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_4_offer: {
    text: '"엡실론 에리다니의 바스케스 선장은 내 언니를 알았어요. 몇 년 전에 함께 복무했죠." 그녀가 망설인다. 처음 보는 불확실한 모습이다. "메시지를 썼어요. 유미에게. 혹시... 우리가 도착했을 때 언니가 거기 있다면. 바스케스에게 전해 줄래요? 어떻게 해야 할지 알 거예요."',
    choices: [
      {
        text: '"물론이죠. 직접 전해 드릴게요."',
        next: 'mission_4_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"제가 처리할게요."',
        next: 'mission_4_accepted',
        repGain: 3,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"먼저 유미에 대해 더 알려 주세요."',
        next: 'mission_4_yumi_backstory',
      },
      {
        text: '"아직 그쪽으로 가지 않아요."',
        next: 'greeting',
      },
    ],
  },

  mission_4_yumi_backstory: {
    text: '"유미는 생물학자예요. 였어요. 뛰어났죠. 십 년 전에 메리디언 식민 임무에 합류했어요. 델타 파보니스행 편도 여행이었죠." 타나카의 목소리는 조심스럽게 통제되어 있다. "작별 인사도 없이 떠났어요. 쪽지만 남기고요." 잠시 침묵. "이 메시지는 언니에게 하지 못한 모든 말이에요. 바스케스가 어떻게든 식민지에 전해 줄 수 있다면..." 그녀가 말끝을 흐린다. "내겐 중요해요. 구동계보다도. 이 모든 것보다도."',
    choices: [
      {
        text: '"그곳에 전할게요."',
        next: 'mission_4_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"생각할 시간이 좀 필요해요."',
        next: 'greeting',
      },
    ],
  },

  mission_4_accepted: {
    text: '그녀가 봉인된 데이터 칩을 건넨다. 손이 살짝 떨린다. "그냥... 편지예요. 십 년 치 해야 했던 말들." 그녀가 몸을 곧게 편다. "바스케스는 에리다니 허브에 있어요. 엡실론 에리다니요."',
    choices: [
      {
        text: '"반드시 전달할게요."',
        next: null,
      },
    ],
  },

  mission_4_complete: {
    text: '"전해 줬군요." 목소리가 조용하다. "그 메시지... 내겐 전부예요." 그녀가 마음을 가다듬는다. "최종 준비를 할 때가 되면 얘기해요."',
    choices: [
      {
        text: '"언니도 당신 소식을 듣고 싶어 할 거예요."',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"도움이 되어 기뻐요."',
        next: null,
        repGain: 1,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_5_offer: {
    text: `"이게 마지막 단계예요." 그녀가 공구를 든 채 당신의 배 앞에 선다. "파보니스 점프를 하려면 필요한 건: 부채 0, 연료와 물자용 ${ENDGAME_CONFIG.VICTORY_CREDITS.toLocaleString()} 크레딧, 선체 80%, 엔진 90%예요." 그녀가 당신의 눈을 마주 본다. "그리고 나의 신뢰. 완전히."`,
    choices: [
      {
        text: '"준비됐어요. 해 봐요."',
        next: 'mission_5_accepted',
        repGain: 5,
        condition: (_rep, context) =>
          context && context.canStartQuestStage('tanaka', 5),
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"준비할 시간이 더 필요해요."',
        next: 'greeting',
      },
    ],
  },

  mission_5_accepted: {
    text: '"항속 연장기는 완전히 보정됐어요. 마지막 부품도 설치했고요." 그녀가 물러서서 자신의 작품을 감상한다. "이건 아버지의 유산이에요. 그리고 내 것. 이제는 당신의 것이기도 하죠." 그녀가 활성화 키를 건넨다. "준비되면 델타 파보니스로 가요. 함께요."',
    choices: [
      {
        text: '"Together."',
        next: null,
        repGain: 5,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  research_supply: {
    text: (rep, context) => {
      let lines;
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_HIGH) {
        lines = [
          '"배달할 때마다 목표에 가까워져요. 잊지 않을게요."',
          '"의료용 실란트 화합물이군요. 격납 하우징에 쓸모가 있어요. 고마워요."',
        ];
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MID) {
        lines = [
          "\"이럴 필요는 없었어요. 하지만 도움이 안 된다고 하진 않을게요.\"",
          '"몇 주치 조달 서류 작업을 덜어 주네요. 고마워요."',
        ];
      } else {
        lines = [
          '"전자제품. 품질이 좋네요. 결합 어레이에 쓸 수 있겠어요."',
          '"이거 쓸 수 있겠어요. 구동계 시제품이 예상보다 부품을 빨리 소모해요."',
        ];
      }
      const rng = new SeededRandom(
        `tanaka-research-supply-${context.daysElapsed}`
      );
      return rng.pickRandom(lines);
    },
    choices: [
      {
        text: '"도움이 되어 기뻐요."',
        next: 'greeting',
        action: (context) => {
          return context.contributeSupply();
        },
      },
    ],
  },

  pavonis_ready: {
    text: '"좌표 고정. 델타 파보니스. 19.89광년." 그녀가 에어록에 서 있다. "항속 연장기를 가동하면 돌아올 수 없어요. 점프는 편도예요." 목소리는 완벽하게 침착하다. "확실해요?"',
    choices: [
      {
        text: '"날아가죠."',
        next: null,
        action: (context) => {
          context.startPavonisRun();
          return { success: true };
        },
      },
      {
        text: '"아직요. 시간이 더 필요해요."',
        next: null,
      },
    ],
  },
};
