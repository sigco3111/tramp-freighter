import { ALL_NPCS } from '../../game/data/npc-data.js';

export function buildCastList() {
  return ALL_NPCS.map((npc) => ({
    id: npc.id,
    name: npc.name,
    role: npc.role,
  }));
}

export const CREDITS_SECTIONS = [
  {
    type: 'title',
    lines: ['트램프 프레이터 블루스'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'role',
    lines: ['감독', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['각본', 'Claude'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['CAST', '(모든 NPC는 본인 역을 맡았습니다)'],
  },
  // NPC cast list is built dynamically by the component via buildCastList()
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['제작'],
  },
  {
    type: 'role',
    lines: ['제작', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['총괄 프로듀서', 'Claude'],
  },
  {
    type: 'role',
    lines: ['아트 디렉션', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['사운드 디자인', '우주의 공허'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['엔지니어링'],
  },
  {
    type: 'credit-pair',
    lines: [],
    pairs: [
      ['게임 엔진', 'React 18'],
      ['3D 별지도', 'Three.js'],
      ['빌드 시스템', 'Vite'],
      ['테스트 프레임워크', 'Vitest'],
      ['속성 기반 테스트', 'fast-check'],
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['항법'],
  },
  {
    type: 'credit-pair',
    lines: [],
    pairs: [
      ['항성 목록', 'HYG 항성 데이터베이스'],
      ['웜홀 지도 제작', '순수한 허구'],
      ['수록 항성', '알려진 131개 중 117개 (아직까지는)'],
      ['태양에서 가장 가까운 항성', '프록시마 센타우리 — 4.25광년'],
      ['가장 긴 항로', '태양에서 델타 파보니스까지 — 19.89광년'],
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['현지 촬영'],
  },
  {
    type: 'location',
    lines: [
      "태양 · 알파 센타우리 · 바너드별",
      '시리우스 · 볼프 359 · 타우 세티',
      '엡실론 에리다니 · 프로키온 · 로스 154',
      "루이텐별",
      '그리고 다른 항성계 107곳',
      '움직이지 않고 얌전히 있어 준',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['특별히 감사드립니다'],
  },
  {
    type: 'thanks',
    lines: [
      '태양에서 20광년 이내의 실제 별들,',
      '편리한 위치에 존재해 준 것에 대하여.',
      '(제외된 14곳에는 사과드립니다. 예산 문제였습니다.)',
    ],
  },
  {
    type: 'thanks',
    lines: [
      '숫자가 그만두라고 말할 때도',
      '계속 비행한 모든 화물선 선장들.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'humor',
    lines: [
      '이 게임을 만드는 동안 NPC는 한 명도 다치지 않았습니다.',
      '(해적과 세관원, 그리고 가끔은 당신이 해친 경우는 제외하고요.)',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'disclaimer',
    lines: [
      '이 작품에 등장하는 모든 인물은 허구입니다.',
      '실존 인물과 닮은 점이 있더라도',
      '순전히 우연의 일치입니다.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'thankyou',
    lines: ['플레이해 주셔서 감사합니다'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'quote',
    lines: [
      '“별은 당신을 기억하지 않는다. 그 사이에 있는 사람들은 기억할지도 모른다.”',
    ],
  },
];
