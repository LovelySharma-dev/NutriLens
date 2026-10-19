'use client';

import { auditTable, servingIllusion, type AuditNutrients } from '../lib/readingAudit';

type ForestProbe = {
  margin: number | null;
  nearestFlip: {
    feature: string;
    factor: number;
    fromValue: number;
    toValue: number;
    grade: string;
  } | null;
  rejected: number;
  note?: string;
} | null;

const NUTRIENT_LABEL: Record<string, string> = {
  energy: 'energy',
  sugars: 'sugars',
  saturatedFat: 'saturated fat',
  salt: 'salt',
  fiber: 'fiber',
  proteins: 'protein',
};

export default function ReadingAuditPanel({
  nutrients,
  servingGrams,
  portionEnergy,
  forestProbe,
}: {
  nutrients: AuditNutrients | null;
  servingGrams?: number | null;
  portionEnergy?: number | null;
  forestProbe?: ForestProbe;
}) {
  const audit = auditTable(nutrients);
  const serving = servingIllusion(servingGrams, portionEnergy, nutrients?.energy ?? null);

  return (
    <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6" aria-label="Reading audit">
      <h2 className="text-2xl font-bold text-white">Two letters, kept apart</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        The formula letter is the 2017 Nutri-Score foods table. The screen letter is the shelf traffic-light grade.
        The model letter, when the report shows one, is a third number.
      </p>

      {audit.status !== 'ready' ? (
        <p className="mt-4 text-sm text-slate-200">
          A required per 100 g cell is missing, so the formula letter and the screen letter stay uncomputed. Nothing is filled in.
        </p>
      ) : (
        <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1">Formula {audit.formula.letter}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Screen {audit.screening}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">
              {audit.formula.margin.points} point{audit.formula.margin.points === 1 ? '' : 's'} from {audit.formula.margin.toward.join(' or ')}
            </span>
          </div>
          <p>
            {audit.lettersAgree
              ? 'The formula letter and the screen letter match on this table.'
              : `The formula letter and the screen letter are ${audit.letterDistance} step${audit.letterDistance === 1 ? '' : 's'} apart.`}
            {' '}Score {audit.formula.score}. Negative points {audit.formula.negativePoints}, positive points {audit.formula.positivePoints}.
          </p>
          <p>
            {audit.formula.proteinCounted
              ? 'Protein points are counted.'
              : 'Negative points are 11 or more and the fruit percent is unknown, so protein points are not counted.'}
          </p>
          <p>
            {audit.atwater.status === 'coherent'
              ? `Printed energy is ${audit.atwater.statedKcal} kcal. The 4/4/9/2 estimate is ${audit.atwater.estimatedKcal} kcal, with alcohol and polyols omitted. The gap is ${audit.atwater.gapKcal} kcal, inside the rule that flags a gap only when it is above 10% and above 30 kcal.`
              : `Printed energy is ${audit.atwater.statedKcal} kcal. The 4/4/9/2 estimate is ${audit.atwater.estimatedKcal} kcal. The gap is ${audit.atwater.gapKcal} kcal, above both 10% and 30 kcal, so the printed energy and the macronutrients disagree. This check does not say which figure is wrong.`}
          </p>
          {audit.flips.length === 0 ? (
            <p>No single nutrient, inside the per 100 g ceilings, changes the formula letter.</p>
          ) : (
            <div>
              <p className="text-slate-400">Smallest change of one nutrient that moves the formula letter.</p>
              <ul className="mt-2 space-y-1">
                {audit.flips.map((flip) => (
                  <li key={flip.nutrient}>
                    {NUTRIENT_LABEL[flip.nutrient]} {flip.direction === 'increase' ? 'up' : 'down'} {flip.delta} {flip.unit} per 100 g, to {flip.nextLetter}.
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="space-y-1 text-xs text-slate-500">
            {audit.formula.limitations.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      )}

      {serving && (
        <p className="mt-4 text-sm text-slate-300">
          The portion is {serving.servingGrams} g, {Math.round(serving.shareOf100g * 1000) / 10}% of 100 g.
          {serving.scaledPortionKcal != null ? ` Per 100 g energy scaled to this portion is about ${serving.scaledPortionKcal} kcal.` : ''}
          {serving.printedPortionKcal != null && serving.columnsDisagree
            ? ` The label prints ${serving.printedPortionKcal} kcal for the portion. Scaled to 100 g that is ${serving.impliedPer100gKcal} kcal, and the two columns disagree by the same 10% and 30 kcal rule.`
            : ''}
          {serving.printedPortionKcal != null && serving.columnsDisagree === false
            ? ` The printed portion energy scales into the per 100 g column inside that rule.`
            : ''}
        </p>
      )}

      {forestProbe && (
        <p className="mt-4 text-sm text-slate-300">
          {forestProbe.nearestFlip
            ? `On the raw model read, the nearest accepted one-cell probe that changes the forest letter multiplies ${forestProbe.nearestFlip.feature} by ${forestProbe.nearestFlip.factor}, from ${forestProbe.nearestFlip.fromValue} to ${forestProbe.nearestFlip.toValue}, and the letter becomes ${forestProbe.nearestFlip.grade}.`
            : 'On the raw model read, none of the accepted one-cell probes changed the forest letter.'}
          {forestProbe.rejected > 0 ? ` ${forestProbe.rejected} probes sat outside a ceiling and were not counted as letter changes.` : ''}
          {forestProbe.margin != null ? ` The gap between the top class probability and the runner-up is ${forestProbe.margin}. That gap is not a calibrated probability.` : ''}
        </p>
      )}
    </section>
  );
}
