const BASE_TITLE = 'Tramp Freighter Blues';

const VIEW_MODE_TITLES = {
  SHIP_NAMING: '배 이름 짓기',
  ORBIT: '성도',
  STATION: '정거장',
  ENCOUNTER: '조우',
  PAVONIS_RUN: '파보니스 항해',
  EPILOGUE: '에필로그',
};

export function getPageTitle(viewMode) {
  const prefix = VIEW_MODE_TITLES[viewMode];
  return prefix ? `${prefix} - ${BASE_TITLE}` : BASE_TITLE;
}
