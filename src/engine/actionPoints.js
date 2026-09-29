export const WEEKLY_ACTION_POINTS = 3;

export const getActionPoints = (state) => Math.max(0, Number.isFinite(state?.sp) ? state.sp : WEEKLY_ACTION_POINTS);
export const canSpendActionPoint = (state, amount = 1) => getActionPoints(state) >= amount;

export const spendActionPoints = (state, amount = 1) => {
  if (!canSpendActionPoint(state, amount)) return null;
  return { ...state, sp: getActionPoints(state) - amount };
};
