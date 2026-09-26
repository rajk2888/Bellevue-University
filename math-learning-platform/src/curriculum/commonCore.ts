import type { Curriculum } from './types';

/**
 * Grade 1–12 curriculum. Standards codes are Common Core State Standards
 * (approximate alignment) and are optional — other frameworks can be added
 * as separate `Curriculum` objects.
 */
export const commonCore: Curriculum = {
  id: 'common-core',
  name: 'Common Core–aligned (US)',
  standardsNote: 'Codes refer to the Common Core State Standards for Mathematics (approximate alignment).',
  grades: [
    {
      grade: 1,
      domains: [
        {
          id: 'numbers', name: 'Numbers & Counting', icon: '🔢',
          topics: [
            { id: 'counting', name: 'Counting & Place Value', lessons: [
              { id: 'g1-place-value', title: 'Tens and Ones', skillId: 'place-value', startDifficulty: 'easy', standards: ['1.NBT.B.2'] },
              { id: 'g1-counting-120', title: 'Counting to 120', description: 'Count forward from any number, read and write numerals.' },
            ] },
          ],
        },
        {
          id: 'operations', name: 'Addition & Subtraction', icon: '➕',
          topics: [
            { id: 'add-sub-20', name: 'Add and Subtract within 20', lessons: [
              { id: 'g1-addition', title: 'Adding by Counting On', skillId: 'add-within-100', workedExample: '5 + 3', startDifficulty: 'easy', standards: ['1.OA.C.6'] },
              { id: 'g1-subtraction', title: 'Taking Away', skillId: 'subtract-within-100', workedExample: '9 - 4', startDifficulty: 'easy', standards: ['1.OA.C.6'] },
            ] },
          ],
        },
        {
          id: 'measurement', name: 'Measurement & Time', icon: '⏰',
          topics: [
            { id: 'time', name: 'Time', lessons: [{ id: 'g1-time', title: 'Hours and Half Hours', skillId: 'telling-time', startDifficulty: 'easy', standards: ['1.MD.B.3'] }] },
            { id: 'length', name: 'Length', lessons: [{ id: 'g1-length', title: 'Comparing Lengths', description: 'Order objects by length and measure with same-size units.' }] },
          ],
        },
        {
          id: 'geometry', name: 'Shapes', icon: '🔺',
          topics: [{ id: 'shapes', name: '2D Shapes', lessons: [{ id: 'g1-shapes', title: 'Sides and Corners', skillId: 'shapes', startDifficulty: 'easy', standards: ['1.G.A.1'] }] }],
        },
        {
          id: 'fractions', name: 'Simple Fractions', icon: '🍰',
          topics: [{ id: 'halves', name: 'Halves and Fourths', lessons: [{ id: 'g1-halves', title: 'Equal Shares', description: 'Split circles and rectangles into halves and fourths.' }] }],
        },
      ],
    },
    {
      grade: 2,
      domains: [
        {
          id: 'operations', name: 'Addition & Subtraction', icon: '➕',
          topics: [
            { id: 'add-sub-100', name: 'Add and Subtract within 100', lessons: [
              { id: 'g2-addition', title: 'Adding with Regrouping', skillId: 'add-within-100', workedExample: '48 + 37', startDifficulty: 'hard', standards: ['2.NBT.B.5'] },
              { id: 'g2-subtraction', title: 'Subtracting with Regrouping', skillId: 'subtract-within-100', workedExample: '62 - 27', startDifficulty: 'hard', standards: ['2.NBT.B.5'] },
            ] },
          ],
        },
        {
          id: 'numbers', name: 'Place Value', icon: '🔢',
          topics: [{ id: 'place-value', name: 'Hundreds, Tens and Ones', lessons: [{ id: 'g2-place-value', title: 'Three-Digit Numbers', skillId: 'place-value', startDifficulty: 'hard', standards: ['2.NBT.A.1'] }] }],
        },
        {
          id: 'measurement', name: 'Money & Time', icon: '💰',
          topics: [
            { id: 'money', name: 'Money', lessons: [{ id: 'g2-money', title: 'Counting Coins', skillId: 'money', startDifficulty: 'medium', standards: ['2.MD.C.8'] }] },
            { id: 'time', name: 'Time', lessons: [{ id: 'g2-time', title: 'Time to Five Minutes', skillId: 'telling-time', startDifficulty: 'hard', standards: ['2.MD.C.7'] }] },
          ],
        },
        {
          id: 'geometry', name: 'Shapes', icon: '🔷',
          topics: [{ id: 'shapes', name: 'Polygons', lessons: [{ id: 'g2-shapes', title: 'Triangles to Hexagons', skillId: 'shapes', startDifficulty: 'medium', standards: ['2.G.A.1'] }] }],
        },
      ],
    },
    {
      grade: 3,
      domains: [
        {
          id: 'operations', name: 'Multiplication & Division', icon: '✖️',
          topics: [
            { id: 'mult', name: 'Multiplication', lessons: [{ id: 'g3-multiplication', title: 'Equal Groups and Arrays', skillId: 'multiplication-facts', workedExample: '4 x 6', startDifficulty: 'easy', standards: ['3.OA.A.1', '3.OA.C.7'] }] },
            { id: 'div', name: 'Division', lessons: [{ id: 'g3-division', title: 'Sharing Equally', skillId: 'division-facts', workedExample: '15 / 3', startDifficulty: 'easy', standards: ['3.OA.A.2', '3.OA.C.7'] }] },
          ],
        },
        {
          id: 'fractions', name: 'Fractions', icon: '🍕',
          topics: [{ id: 'understand', name: 'Understanding Fractions', lessons: [{ id: 'g3-equivalent-fractions', title: 'Equivalent Fractions', skillId: 'equivalent-fractions', startDifficulty: 'easy', standards: ['3.NF.A.3'] }] }],
        },
        {
          id: 'measurement', name: 'Measurement & Geometry', icon: '📐',
          topics: [{ id: 'area', name: 'Area', lessons: [{ id: 'g3-area', title: 'Area of Rectangles', skillId: 'area', startDifficulty: 'easy', standards: ['3.MD.C.7'] }] }],
        },
      ],
    },
    {
      grade: 4,
      domains: [
        {
          id: 'operations', name: 'Multi-Digit Operations', icon: '✖️',
          topics: [{ id: 'mult', name: 'Multi-Digit Multiplication', lessons: [{ id: 'g4-multiplication', title: 'Multiplying by Breaking Apart', skillId: 'multiplication-facts', workedExample: '6 x 23', startDifficulty: 'challenge', standards: ['4.NBT.B.5'] }, { id: 'g4-division', title: 'Division with Remainders', skillId: 'division-facts', startDifficulty: 'hard', standards: ['4.NBT.B.6'] }] }],
        },
        {
          id: 'fractions', name: 'Fractions', icon: '🍕',
          topics: [
            { id: 'add-fractions', name: 'Adding & Subtracting Fractions', lessons: [
              { id: 'g4-add-fractions', title: 'Adding Fractions with Like Denominators', skillId: 'add-fractions', workedExample: '2/5 + 1/5', startDifficulty: 'easy', standards: ['4.NF.B.3'] },
              { id: 'g4-equivalent-fractions', title: 'Equivalent Fractions', skillId: 'equivalent-fractions', startDifficulty: 'medium', standards: ['4.NF.A.1'] },
            ] },
            { id: 'decimals', name: 'Decimals', lessons: [{ id: 'g4-decimals', title: 'Tenths and Hundredths', skillId: 'decimals', startDifficulty: 'easy', standards: ['4.NF.C.5'] }] },
          ],
        },
        {
          id: 'geometry', name: 'Geometry & Measurement', icon: '📐',
          topics: [{ id: 'area', name: 'Area & Perimeter', lessons: [{ id: 'g4-area', title: 'Area Word Problems', skillId: 'area', startDifficulty: 'medium', standards: ['4.MD.A.3'] }, { id: 'g4-angles', title: 'Measuring Angles', description: 'Use a protractor to measure and draw angles in degrees.' }] }],
        },
      ],
    },
    {
      grade: 5,
      domains: [
        {
          id: 'fractions', name: 'Fractions', icon: '🍕',
          topics: [
            { id: 'add-fractions', name: 'Adding & Subtracting Fractions', lessons: [
              { id: 'g5-add-fractions', title: 'Adding Fractions', skillId: 'add-fractions', workedExample: '3/4 + 1/2', startDifficulty: 'medium', standards: ['5.NF.A.1', '5.NF.A.2'] },
              { id: 'g5-subtract-fractions', title: 'Subtracting Fractions', skillId: 'subtract-fractions', workedExample: '5/6 - 1/4', startDifficulty: 'medium', standards: ['5.NF.A.1'] },
            ] },
            { id: 'multiply-fractions', name: 'Multiplying Fractions', lessons: [{ id: 'g5-multiply-fractions', title: 'Fraction × Fraction', description: 'Multiply numerators and denominators, and see it as area.' }] },
          ],
        },
        {
          id: 'decimals', name: 'Decimals & Percent', icon: '💯',
          topics: [
            { id: 'decimals', name: 'Decimal Operations', lessons: [{ id: 'g5-decimals', title: 'Adding Decimals', skillId: 'decimals', workedExample: '2.5 + 1.75', startDifficulty: 'medium', standards: ['5.NBT.B.7'] }] },
            { id: 'percent', name: 'Introduction to Percent', lessons: [{ id: 'g5-percent', title: 'What Is a Percent?', skillId: 'percent', startDifficulty: 'easy' }] },
          ],
        },
        {
          id: 'geometry', name: 'Geometry & Measurement', icon: '📦',
          topics: [{ id: 'volume', name: 'Volume', lessons: [{ id: 'g5-volume', title: 'Volume of Rectangular Prisms', description: 'Count unit cubes and use V = l × w × h.' }, { id: 'g5-coordinate', title: 'The Coordinate Plane', description: 'Plot points in the first quadrant.' }] }],
        },
      ],
    },
    {
      grade: 6,
      domains: [
        {
          id: 'ratios', name: 'Ratios & Percent', icon: '⚖️',
          topics: [
            { id: 'ratios', name: 'Ratios & Rates', lessons: [{ id: 'g6-ratios', title: 'Ratio Tables', skillId: 'ratios', workedExample: '2/3 = 8/x', startDifficulty: 'easy', standards: ['6.RP.A.1', '6.RP.A.3'] }] },
            { id: 'percent', name: 'Percent', lessons: [{ id: 'g6-percent', title: 'Percent of a Number', skillId: 'percent', workedExample: '25% of 60', startDifficulty: 'medium', standards: ['6.RP.A.3c'] }] },
          ],
        },
        {
          id: 'expressions', name: 'Expressions & Equations', icon: '🧮',
          topics: [{ id: 'one-step', name: 'One-Step Equations', lessons: [{ id: 'g6-equations', title: 'Solving One-Step Equations', skillId: 'linear-equations', workedExample: 'x + 7 = 15', startDifficulty: 'easy', standards: ['6.EE.B.7'] }] }],
        },
        {
          id: 'statistics', name: 'Statistics', icon: '📊',
          topics: [{ id: 'center', name: 'Measures of Center', lessons: [{ id: 'g6-mean', title: 'Mean (Average)', skillId: 'mean', workedExample: 'mean of 12, 18, 15, 19', startDifficulty: 'easy', standards: ['6.SP.B.5c'] }] }],
        },
        {
          id: 'geometry', name: 'Geometry', icon: '📐',
          topics: [{ id: 'area', name: 'Area', lessons: [{ id: 'g6-area', title: 'Area of Rectangles & Composite Figures', skillId: 'area', startDifficulty: 'hard', standards: ['6.G.A.1'] }] }],
        },
      ],
    },
    {
      grade: 7,
      domains: [
        {
          id: 'numbers', name: 'The Number System', icon: '➖',
          topics: [{ id: 'integers', name: 'Integers', lessons: [{ id: 'g7-integers', title: 'Adding & Subtracting Integers', skillId: 'integers', workedExample: '-7 + 12', startDifficulty: 'medium', standards: ['7.NS.A.1'] }] }],
        },
        {
          id: 'ratios', name: 'Proportional Relationships', icon: '⚖️',
          topics: [
            { id: 'proportions', name: 'Proportions', lessons: [{ id: 'g7-proportions', title: 'Solving Proportions', skillId: 'ratios', workedExample: '3/4 = 9/x', startDifficulty: 'medium', standards: ['7.RP.A.2'] }] },
            { id: 'percent', name: 'Percent Problems', lessons: [{ id: 'g7-discounts', title: 'Discounts and Sales', skillId: 'percent', workedExample: '$60 with 25% off', startDifficulty: 'hard', standards: ['7.RP.A.3'] }] },
          ],
        },
        {
          id: 'equations', name: 'Expressions & Equations', icon: '🧮',
          topics: [{ id: 'two-step', name: 'Two-Step Equations', lessons: [{ id: 'g7-two-step', title: 'Solving Two-Step Equations', skillId: 'linear-equations', workedExample: '2x + 5 = 17', startDifficulty: 'medium', standards: ['7.EE.B.4a'] }, { id: 'g7-inequalities', title: 'Inequalities', description: 'Solve and graph inequalities like 2x + 3 < 11.' }] }],
        },
        {
          id: 'probability', name: 'Probability', icon: '🎲',
          topics: [{ id: 'chance', name: 'Chance Events', lessons: [{ id: 'g7-probability', title: 'Simple Probability', skillId: 'probability', startDifficulty: 'medium', standards: ['7.SP.C.5', '7.SP.C.7'] }] }],
        },
      ],
    },
    {
      grade: 8,
      domains: [
        {
          id: 'equations', name: 'Equations', icon: '🧮',
          topics: [
            { id: 'multi-step', name: 'Multi-Step Equations', lessons: [{ id: 'g8-multi-step', title: 'Variables on Both Sides', skillId: 'linear-equations', workedExample: '3(x - 4) = 2x + 1', startDifficulty: 'hard', standards: ['8.EE.C.7'] }] },
            { id: 'systems', name: 'Systems of Equations', lessons: [{ id: 'g8-systems', title: 'Where Two Lines Meet', skillId: 'systems', workedExample: 'y = 2x + 1 and y = -x + 7', startDifficulty: 'easy', standards: ['8.EE.C.8'] }] },
          ],
        },
        {
          id: 'functions', name: 'Functions', icon: '📈',
          topics: [{ id: 'linear', name: 'Linear Functions', lessons: [{ id: 'g8-slope', title: 'Slope as Rate of Change', skillId: 'slope', workedExample: 'slope of (1, 2) and (4, 8)', startDifficulty: 'easy', standards: ['8.EE.B.6', '8.F.B.4'] }] }],
        },
        {
          id: 'geometry', name: 'Geometry', icon: '📐',
          topics: [{ id: 'pythag', name: 'Pythagorean Theorem', lessons: [{ id: 'g8-pythagorean', title: 'Finding the Hypotenuse', skillId: 'pythagorean', workedExample: 'right triangle with legs 6 and 8', startDifficulty: 'easy', standards: ['8.G.B.7'] }, { id: 'g8-transformations', title: 'Transformations', description: 'Translations, reflections, rotations and dilations on the coordinate plane.' }] }],
        },
      ],
    },
    {
      grade: 9,
      domains: [
        {
          id: 'algebra', name: 'Algebra I', icon: '🧮',
          topics: [
            { id: 'linear', name: 'Linear Equations', lessons: [{ id: 'g9-linear', title: 'Solving Linear Equations', skillId: 'linear-equations', startDifficulty: 'challenge', standards: ['HSA-REI.B.3'] }] },
            { id: 'systems', name: 'Systems of Equations', lessons: [{ id: 'g9-systems', title: 'Solving Systems by Substitution', skillId: 'systems', startDifficulty: 'medium', standards: ['HSA-REI.C.6'] }] },
            { id: 'quadratics', name: 'Quadratics', lessons: [{ id: 'g9-quadratics', title: 'Solving Quadratics by Factoring', skillId: 'quadratics', workedExample: 'x^2 - 5x + 6 = 0', startDifficulty: 'medium', standards: ['HSA-REI.B.4b'] }] },
          ],
        },
        {
          id: 'functions', name: 'Functions', icon: '📈',
          topics: [{ id: 'linear-functions', name: 'Linear Functions', lessons: [{ id: 'g9-slope', title: 'Slope-Intercept Form', skillId: 'slope', startDifficulty: 'medium', standards: ['HSF-IF.B.6'] }] }],
        },
      ],
    },
    {
      grade: 10,
      domains: [
        {
          id: 'geometry', name: 'Geometry', icon: '📐',
          topics: [
            { id: 'right-triangles', name: 'Right Triangles', lessons: [
              { id: 'g10-pythagorean', title: 'Pythagorean Theorem Applications', skillId: 'pythagorean', startDifficulty: 'hard', standards: ['HSG-SRT.C.8'] },
              { id: 'g10-trig', title: 'SOH CAH TOA', skillId: 'trigonometry', startDifficulty: 'easy', standards: ['HSG-SRT.C.6', 'HSG-SRT.C.8'] },
            ] },
            { id: 'transformations', name: 'Transformations', lessons: [{ id: 'g10-transformations', title: 'Rigid Motions & Congruence', description: 'Use transformations to prove figures congruent.' }] },
          ],
        },
        {
          id: 'algebra', name: 'Algebra', icon: '🧮',
          topics: [{ id: 'quadratics', name: 'Quadratics', lessons: [{ id: 'g10-quadratic-formula', title: 'The Quadratic Formula', skillId: 'quadratics', workedExample: '2x^2 + 3x - 5 = 0', startDifficulty: 'challenge', standards: ['HSA-REI.B.4b'] }] }],
        },
        {
          id: 'statistics', name: 'Statistics', icon: '📊',
          topics: [{ id: 'data', name: 'Data Analysis', lessons: [{ id: 'g10-statistics', title: 'Center and Spread', skillId: 'mean', startDifficulty: 'challenge', standards: ['HSS-ID.A.2'] }] }],
        },
      ],
    },
    {
      grade: 11,
      domains: [
        {
          id: 'advanced-algebra', name: 'Advanced Algebra', icon: '🧮',
          topics: [
            { id: 'exponential', name: 'Exponential & Logarithmic Functions', lessons: [
              { id: 'g11-exponentials', title: 'Solving Exponential Equations', skillId: 'exponentials', workedExample: '2^x = 32', startDifficulty: 'medium', standards: ['HSF-LE.A.4'] },
              { id: 'g11-compound-interest', title: 'Compound Interest', skillId: 'compound-interest', workedExample: 'compound interest $1000 at 5% for 3 years', startDifficulty: 'easy', standards: ['HSA-SSE.B.3c'] },
            ] },
            { id: 'polynomials', name: 'Polynomials', lessons: [{ id: 'g11-polynomials', title: 'Polynomial Division', description: 'Divide polynomials and use the remainder theorem.' }] },
          ],
        },
        {
          id: 'trigonometry', name: 'Trigonometry', icon: '📐',
          topics: [{ id: 'trig', name: 'Trigonometric Ratios', lessons: [{ id: 'g11-trig', title: 'Solving Right Triangles', skillId: 'trigonometry', startDifficulty: 'hard', standards: ['HSG-SRT.C.8'] }, { id: 'g11-unit-circle', title: 'The Unit Circle', description: 'Extend sine and cosine to all angles using the unit circle.' }] }],
        },
        {
          id: 'probability', name: 'Probability & Statistics', icon: '🎲',
          topics: [{ id: 'probability', name: 'Probability', lessons: [{ id: 'g11-probability', title: 'Probability Models', skillId: 'probability', startDifficulty: 'challenge', standards: ['HSS-CP.A.1'] }] }],
        },
      ],
    },
    {
      grade: 12,
      domains: [
        {
          id: 'calculus', name: 'Calculus Fundamentals', icon: '∫',
          topics: [
            { id: 'derivatives', name: 'Derivatives', lessons: [{ id: 'g12-derivatives', title: 'The Power Rule', skillId: 'derivatives', workedExample: 'derivative of 3x^2 + 2x - 5', startDifficulty: 'easy' }] },
            { id: 'limits', name: 'Limits', lessons: [{ id: 'g12-limits', title: 'Understanding Limits', description: 'What value does a function approach?' }] },
            { id: 'integrals', name: 'Integrals', lessons: [{ id: 'g12-integrals', title: 'Area Under a Curve', description: 'Antiderivatives and the Fundamental Theorem of Calculus.' }] },
          ],
        },
        {
          id: 'precalculus', name: 'Precalculus', icon: '📈',
          topics: [{ id: 'exp-log', name: 'Exponential Models', lessons: [{ id: 'g12-compound-interest', title: 'Growth & Compound Interest', skillId: 'compound-interest', startDifficulty: 'hard', standards: ['HSF-LE.A.1'] }, { id: 'g12-logarithms', title: 'Logarithms', skillId: 'exponentials', startDifficulty: 'hard', standards: ['HSF-BF.B.5'] }] }],
        },
      ],
    },
  ],
};
