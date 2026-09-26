import { addFractions, equivalentFractions, subtractFractions } from './skills/fractions';
import { addition, division, multiplication, placeValue, subtraction } from './skills/arithmetic';
import { integers, linearEquations, quadratics, slope, systems } from './skills/algebra';
import { area, decimals, mean, percent, probability, pythagorean, ratios } from './skills/applied';
import { compoundInterest, derivatives, exponentials, trigonometry } from './skills/advanced';
import { countingMoney, shapes, tellingTime } from './skills/early';
import type { Skill } from './types';

/**
 * All skills known to the engine. To add a new skill, implement the `Skill`
 * interface and register it here — lessons, practice, quizzes, search and the
 * problem solver pick it up automatically.
 */
export const SKILLS: Skill[] = [
  addition,
  subtraction,
  placeValue,
  tellingTime,
  countingMoney,
  shapes,
  multiplication,
  division,
  equivalentFractions,
  addFractions,
  subtractFractions,
  decimals,
  area,
  percent,
  ratios,
  integers,
  mean,
  probability,
  linearEquations,
  slope,
  pythagorean,
  systems,
  quadratics,
  exponentials,
  trigonometry,
  compoundInterest,
  derivatives,
];

const byId = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return byId.get(id);
}
