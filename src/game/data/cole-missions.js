export const COLE_FAVOR_MISSIONS = [
  {
    id: 'cole_courier',
    type: 'delivery',
    source: 'cole',
    title: '봉인된 소포',
    description: '콜이 봉인된 소포를 배달해 달라고 한다. 묻지 않는 조건이다.',
    requirements: {
      deadline: 21,
      cargoSpace: 1,
    },
    missionCargo: {
      good: 'sealed_package',
      quantity: 1,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 8,
  },
  {
    id: 'cole_passenger',
    type: 'passenger',
    source: 'cole',
    title: '은밀한 승객',
    description: "콜의 동료 한 명이 조용한 이동 수단을 필요로 한다.",
    requirements: {
      deadline: 14,
      cargoSpace: 5,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 10,
  },
  {
    id: 'cole_intimidation',
    type: 'delivery',
    source: 'cole',
    title: '존재감 과시',
    description: '지정된 정거장에 도킹하라. 당신의 도착이 곧 메시지다.',
    requirements: {
      deadline: 21,
      cargoSpace: 0,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 12,
  },
];
