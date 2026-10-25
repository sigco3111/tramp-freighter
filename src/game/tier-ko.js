const TIER_KO = {
  Hostile: '적대',
  Cold: '냉담',
  Neutral: '중립',
  Warm: '온화',
  Friendly: '우호',
  Trusted: '신뢰',
  Family: '가족',
};
export function tierKo(name) {
  return TIER_KO[name] || name;
}
