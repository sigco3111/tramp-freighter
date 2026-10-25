import {
  NARRATIVE_EVENT_CONFIG,
  CONDITION_TYPES,
  ENDGAME_CONFIG,
} from '../constants.js';
import { getReachableSystems } from '../utils/wormhole-graph.js';

const {
  NARRATIVE_PRIORITY_CRITICAL,
  NARRATIVE_PRIORITY_HIGH,
  NARRATIVE_PRIORITY_DEFAULT,
  NARRATIVE_PRIORITY_LOW,
  RUMOR_MAX_HOPS,
} = NARRATIVE_EVENT_CONFIG;

/**
 * Narrative event definitions.
 *
 * Each event follows the EventEngine schema:
 * - type: dock | jump | time | condition | chain
 * - category: always 'narrative'
 * - trigger: { system, condition, chance }
 * - content: { text[], speaker, mood, choices[] }
 * - choices[].effects: { costs: {}, rewards: {} }
 */
export const NARRATIVE_EVENTS = [
  // === DOCK EVENTS ===

  {
    id: 'dock_sol_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 0, condition: { type: 'first_dock' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '솔 정거장. 인류 문명의 심장.',
        '거대하다. 번쩍인다. 비싸다.',
        '당신은 아주 작고 아주 가난하다고 느낀다.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '이제 일하러 갈 시간이다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 4, condition: { type: 'first_dock' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '도킹 클램프가 몸서리치며 맞물린다.',
        "바너드 정거장은 예상보다 작다. 개조한 채굴 플랫폼이다.",
        "부두 일꾼이 3번 베이로 가라고 손짓한다. 작업복에 빛바랜 스텐실로 'CHEN'이라고 적혀 있다.",
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '손을 흔들어 답하고 교역소로 향한다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '멈춰서 자기소개를 한다.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: '무시하고 화물 목록을 확인한다.',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_generic_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.15 },
    once: false,
    cooldown: 10,
    priority: NARRATIVE_PRIORITY_LOW,
    generateContent(state, starData) {
      const activeEvents = state.world.activeEvents || [];
      const currentSystem = state.player.currentSystem;
      const reachable = getReachableSystems(currentSystem, RUMOR_MAX_HOPS);
      const reachableIds = new Set(reachable.map((r) => r.systemId));
      reachableIds.add(currentSystem);

      const nearbyEvents = activeEvents.filter((e) =>
        reachableIds.has(e.systemId)
      );

      if (nearbyEvents.length > 0) {
        const event = nearbyEvents[0];
        const system = starData.find((s) => s.id === event.systemId);
        const commodity = Object.keys(event.modifiers || {})[0];

        if (system && commodity) {
          return {
            text: [
              '허가를 기다리는 동안 부두 일꾼이 슬쩍 다가온다.',
              `"${system.name}에서 ${commodity} 가격이 천정부지라더군. 그냥 하는 말이야."`,
            ],
          };
        }
      }

      return {
        text: [
          '허가를 기다리는 동안 부두 일꾼이 슬쩍 다가온다.',
          '"저 바깥 시장이 변하고 있어. 눈 크게 뜨고 다니게."',
        ],
      };
    },
    content: {
      text: [
        '허가를 기다리는 동안 부두 일꾼이 슬쩍 다가온다.',
        '"저 바깥 시장이 변하고 있어. 눈 크게 뜨고 다니게."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"팁 고마워요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"신경 꺼요."',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_beyond_the_lanes_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        {
          type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT,
          value: ENDGAME_CONFIG.BEYOND_LANES_RUMOR_SYSTEMS,
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        '허가를 기다리는 동안 부두 일꾼이 슬쩍 다가온다.',
        '"고참들하고 얘기해 본 적 있어? 어떤 사람들은 어떤 별지도에도 안 나오는 항로가 있다고 맹세해. 웜홀 네트워크 너머의 장소들."',
        '그녀가 어깨를 으쓱한다. "그냥 우주 뱃사람들 얘기겠지. 하지만 누가 알겠어?"',
      ],
      speaker: null,
      mood: 'mysterious',
      choices: [
        {
          text: '"흥미롭네요. 어디서 더 들을 수 있죠?"',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"알려진 항로만으로도 걱정할 게 충분해요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_engineer_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        {
          type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT,
          value: ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS,
        },
        {
          type: CONDITION_TYPES.FLAG_NOT_SET,
          flag: 'tanaka_met',
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '허가를 기다리는 동안 부두 일꾼이 슬쩍 다가온다.',
        '"이봐, 타나카 구동계 쓰지? 설계자의 딸이 바너드 항성에서 일한다던데. 실험적인 구동 기술을 다뤄, 웜홀 네트워크가 의도한 것보다 더 멀리 배를 보내는 거."',
        '그가 목소리를 낮춘다. "같이 일할 사람은 까다롭게 고르지만."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"고마워요. 한번 가 볼 만하네요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"신경 꺼요."',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_cheap_fuel',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 20 },
      chance: 0.5,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '정비공이 도킹하는 당신의 연료 게이지를 알아챈다.',
        '"연료가 바닥났군, 응? 수송선에서 떨어진 연료통이 좀 있어. 반값에 줄게."',
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: '"Deal."',
          next: null,
          effects: { costs: { credits: 50 }, rewards: { fuelMinimum: 30 } },
        },
        {
          text: '"됐어요, 위험하게 사는 게 좋아서요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === JUMP EVENTS ===

  {
    id: 'jump_salvage',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.05 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '센서가 울린다. 전방에 잔해 지대.',
        '화물 컨테이너 같다. 멀쩡할지도.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '잔해를 조사한다.',
          next: 'jump_salvage_result',
          effects: { costs: { fuel: 2 }, rewards: {} },
        },
        {
          text: '계속 간다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_salvage_result',
    type: 'chain',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 0,
    content: {
      text: [
        '봉인을 연다. 안에는 예비 부품 상자가 있다.',
        '인양권. 먼저 줍는 사람이 임자.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '실어 올린다.',
          next: null,
          effects: {
            costs: {},
            rewards: {
              cargo: [
                {
                  good: 'parts',
                  qty: 3,
                  buyPrice: 0,
                  buySystemName: '인양함',
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    id: 'jump_quiet_moment',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.08 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        '웜홀 통과가 매끄럽다. 이상하리만치 매끄럽다.',
        '잠시 창밖의 별들이 거의 평화로워 보인다.',
        '지금 이 순간 얼마나 많은 화물선 선장이 저 바깥에서 홀로 생각에 잠겨 있을지 궁금해진다.',
      ],
      speaker: null,
      mood: 'calm',
      choices: [
        {
          text: '고요를 즐긴다.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: '다시 일하러.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_strange_signal',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.04 },
    once: false,
    cooldown: 7,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '통신 배열이 신호를 잡는다. 오래된 신호. 반복 재생 중이다.',
        '조난 신호처럼 들리지만 암호화 방식이 수백 년은 뒤처졌다.',
        '이걸 보낸 무언가는 이미 오래전에 사라졌다.',
      ],
      speaker: null,
      mood: 'mysterious',
      choices: [
        {
          text: '좌표를 기록하고 넘어간다.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: '무시한다. 내 문제가 아니다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === TIME EVENTS ===

  {
    id: 'time_debt_warning',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        { type: 'days_past', value: 30 },
        { type: 'debt_above', value: 8000 },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '마커스 콜의 메시지.',
        '"유예 기간은 끝났네. 이자가 쌓이기 시작하지. 그리고 자네 거래에 걸린 담보권이 방금 더 무거워졌어."',
      ],
      speaker: '마커스 콜',
      mood: 'threatening',
      choices: [
        {
          text: '메시지를 삭제한다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cole_first_payment_hint',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        { type: CONDITION_TYPES.FLAG_SET, flag: 'cole_first_payment_hint' },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '마커스 콜의 메시지.',
        '"좋아. 배우고 있군." 잠시 침묵. "하지만 장부를 비운 건 첫걸음일 뿐이네. 이 삶에서 정말 벗어나는 선장들은 가는 길에 제대로 된 친구를 사귀었지."',
      ],
      speaker: '마커스 콜',
      mood: 'neutral',
      choices: [
        {
          text: '"기억해 둘게요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'time_news_broadcast',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'days_past', value: 15 },
      chance: 0.2,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        '뉴스피드가 지지직거리며 켜진다.',
        '"...내행성과 외행성 식민지 간의 무역 분쟁이 이어지고 있습니다. 상품 가격은 계속 불안정합니다..."',
        '맨날 똑같은 얘기.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '계속 듣는다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '끈다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === CONDITION EVENTS ===

  {
    id: 'cond_low_fuel',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 10 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '연료 경고등이 끈질기게 깜빡인다.',
        '두드려 본다. 계속 깜빡인다.',
        "연료가 바닥나 가고 있다.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: '빨리 정거장을 찾는 게 좋겠다.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_hull_damage',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'hull_below', value: 30 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '선체 전체에 깊은 신음이 울린다.',
        '지난번 땜질은 버티고 있지만 간신히다.',
        "한 번만 더 세게 부딪히면 진공을 마시게 된다.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: '메모: 수리 부두를 찾을 것.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_debt_free',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'debt_below', value: 1 },
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '대차대조표를 바라본다. 다시 읽는다.',
        '0. 빚이 하나도 없다.',
        '무게가 가신다. 이 배를 산 뒤 처음으로 숨을 쉴 수 있다.',
        "이제 앞에 있는 정거장들이 어떤 기회를 줄지 볼 때다.",
      ],
      speaker: null,
      mood: 'triumphant',
      choices: [
        {
          text: "자유다.",
          next: null,
          effects: { costs: {}, rewards: { karma: 2 } },
        },
      ],
    },
  },

  // === PASSENGER EVENTS ===

  {
    id: 'passenger_complaint_comfort',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_passenger' }, chance: 0.15 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '승객이 좁은 선실에 대해 불평한다.',
        "분명히 불편해 보인다.",
      ],
      speaker: null,
      mood: 'annoyed',
      choices: [
        {
          text: '사과하고 다과를 내놓는다.',
          next: null,
          effects: {
            costs: { credits: 20 },
            rewards: { passengerSatisfaction: 5 },
          },
        },
        {
          text: "여긴 화물선이지 유람선이 아니다.",
          next: null,
          effects: { costs: { passengerSatisfaction: 10 }, rewards: {} },
        },
        {
          text: '불평을 무시한다.',
          next: null,
          effects: { costs: { passengerSatisfaction: 5 }, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'passenger_wealthy_tip',
    type: 'dock',
    category: 'narrative',
    trigger: { condition: { type: 'has_wealthy_passenger' }, chance: 0.5 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '부유한 승객이 당신의 서비스에 감명받았다.',
        '후한 팁을 내놓는다.',
      ],
      speaker: null,
      mood: 'pleased',
      choices: [
        {
          text: '정중히 받는다.',
          next: null,
          effects: { costs: {}, rewards: { credits: 500 } },
        },
        {
          text: '정중히 사양한다.',
          next: null,
          effects: { costs: {}, rewards: { passengerSatisfaction: 10 } },
        },
      ],
    },
  },

  {
    id: 'passenger_family_children',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_family_passenger' }, chance: 0.2 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        '아이들이 슬슬 안절부절못한다.',
        '부모들은 미안해하는 표정이다.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '조종실을 보여 준다.',
          next: null,
          effects: { costs: {}, rewards: { passengerSatisfaction: 15 } },
        },
        {
          text: '간식을 준다.',
          next: null,
          effects: {
            costs: { credits: 10 },
            rewards: { passengerSatisfaction: 10 },
          },
        },
        {
          text: '무시한다.',
          next: null,
          effects: { costs: { passengerSatisfaction: 5 }, rewards: {} },
        },
      ],
    },
  },

  // === QUEST EVENTS ===

  {
    id: 'dock_barnards_pre_tanaka',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: ENDGAME_CONFIG.TANAKA_SYSTEM,
      condition: [
        {
          type: CONDITION_TYPES.FLAG_NOT_SET,
          flag: 'tanaka_met',
        },
        {
          type: CONDITION_TYPES.QUEST_STAGE,
          questId: 'tanaka',
          value: 0,
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        '구동계 개조를 하는 엔지니어에 대해 수소문한다.',
        '부두 기술자가 당신을 훑어본다. "타나카? 응, 여기 있어. 하지만 풋내기 조종사하고는 말 안 해."',
        '"그녀는 섹터를 직접 본 조종사를 원해. 한 항로만 왕복하는 게 아니라는 걸 증명할 만큼 여러 항구를 다녀 본 사람."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"항구가 몇 군데나 필요하죠?"',
          next: 'dock_barnards_pre_tanaka_followup',
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"다시 올게요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_pre_tanaka_followup',
    type: 'chain',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 0,
    content: {
      text: [
        '"당신이 간 것보다 많아." 부두 기술자가 손가락을 꼽는다.',
        '"더 많은 항성계를 가 봐. 네트워크를 익혀. 실력을 쌓으면 그녀가 알아챌 거야."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"알겠어요. 먼저 더 탐험해 볼게요."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'tanaka_intro',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: ENDGAME_CONFIG.TANAKA_SYSTEM,
      condition: [
        {
          type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT,
          value: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
        },
        { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 0 },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_CRITICAL,
    content: {
      text: [
        "엔지니어 작업복을 입은 여자가 당신의 배가 도킹하는 걸 지켜본다. 당신이 에어록을 나서자 다가온다.",
        '"타나카 구동계. 마크 III, 내가 틀리지 않았다면."',
        '그녀가 배 주위를 돌며 선체를 손으로 쓸어 본다.',
        '"유키 타나카예요. 그 구동계를 설계했죠. 정확히는 아버지가 했고, 제가 개량했어요."',
      ],
      speaker: '유키 타나카',
      mood: 'mysterious',
      choices: [
        {
          text: '"좋은 구동계예요. 믿을 만하죠."',
          next: null,
          effects: { rewards: { karma: 1 } },
          flags: ['tanaka_met'],
        },
        {
          text: '"당신이 그 타나카예요? 얘기 들었어요."',
          next: null,
          effects: { rewards: { karma: 1 } },
          flags: ['tanaka_met'],
        },
        {
          text: '"원하는 게 뭐죠?"',
          next: null,
          effects: {},
          flags: ['tanaka_met'],
        },
      ],
    },
  },
];
