import state from "./catalogState.js";

export function buildQuery() {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    if (value !== null && value !== "" && value !== undefined) {
      params.append(key, value);
    }
  });

  return params.toString();
}
