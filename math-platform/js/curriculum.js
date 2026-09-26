/* StepWise Math — curriculum registry.
 * Developed by Rajkumar Kuppuswami.
 *
 * The curriculum is data, not code. Each grade band lists domains; each domain
 * lists topics. A topic may name an `engine` (see engine.js) that can generate
 * problems and step-by-step explanations; topics without an engine still show
 * their concept, real-world story and outline, and are marked "preview".
 *
 * To add another curriculum or standards framework later, register a new
 * object with the same shape via StepWise.curriculum.register(). `standards`
 * on a topic is a free-form map, e.g. { ccss: "5.NF.A.1" }.
 */
(function (SW) {
  "use strict";

  const bands = [
    { id: "g1-2", label: "Grades 1–2", grades: [1, 2], band: "young",
      blurb: "Counting, adding, shapes, time and money with pictures and objects." },
    { id: "g3-5", label: "Grades 3–5", grades: [3, 4, 5], band: "young",
      blurb: "Multiplication, fractions, decimals and word problems you can see." },
    { id: "g6-8", label: "Grades 6–8", grades: [6, 7, 8], band: "middle",
      blurb: "Ratios, integers, expressions, equations and the start of algebra." },
    { id: "g9-10", label: "Grades 9–10", grades: [9, 10], band: "high",
      blurb: "Linear equations, systems, functions, quadratics and geometry proofs." },
    { id: "g11-12", label: "Grades 11–12", grades: [11, 12], band: "high",
      blurb: "Trigonometry, logarithms, precalculus and the ideas behind calculus." },
  ];

  // Short helper so topic lists stay readable.
  const t = (id, title, domain, grade, extra = {}) => Object.assign({ id, title, domain, grade }, extra);

  const topics = [
    // Grades 1–2
    t("count-100", "Counting to 100", "Numbers & Counting", 1, { engine: null,
      concept: "Numbers go up by one each time. After 9 ones we make a new ten.",
      story: "Count the stickers in your sticker book by tens, then by ones." }),
    t("add-within-20", "Adding within 20", "Addition & Subtraction", 1, { engine: "addition",
      concept: "Adding puts two groups together. Counting on from the bigger number is fast.",
      story: "You have 8 marbles and a friend gives you 5 more. How many now?", standards: { ccss: "1.OA.C.6" } }),
    t("sub-within-20", "Subtracting within 20", "Addition & Subtraction", 1, { engine: "subtraction",
      concept: "Subtracting takes some away. You can also count up from the smaller number.",
      story: "There are 15 cookies on a plate and 6 get eaten. How many are left?" }),
    t("place-value-2", "Place value: tens and ones", "Numbers & Counting", 2, {
      concept: "In 47 the 4 means 4 tens (40) and the 7 means 7 ones.",
      story: "Bundle craft sticks into groups of ten to count a big pile quickly." }),
    t("add-2digit", "Adding two-digit numbers", "Addition & Subtraction", 2, { engine: "addition",
      concept: "Add ones to ones and tens to tens. Ten ones make one new ten.",
      story: "A class collects 38 cans on Monday and 27 on Tuesday." }),
    t("shapes-2d", "Flat shapes", "Geometry", 1, {
      concept: "Shapes are named by their sides and corners: a triangle has 3 of each.",
      story: "Find triangles, squares and circles on a playground." }),
    t("time-clock", "Telling time", "Measurement, Time & Money", 2, {
      concept: "The short hand shows the hour; the long hand shows minutes, 5 for each number.",
      story: "School starts at 8:30. Where are the hands?" }),
    t("money-coins", "Counting coins", "Measurement, Time & Money", 2, {
      concept: "Count the biggest coins first, then keep adding the smaller ones.",
      story: "Do 3 quarters and 2 dimes buy a 90¢ snack?" }),
    t("halves-quarters", "Halves and fourths", "Fractions", 2, {
      concept: "A half is 1 of 2 equal parts. A fourth is 1 of 4 equal parts.",
      story: "Share a sandwich fairly between two friends." }),

    // Grades 3–5
    t("mult-facts", "Multiplication facts", "Multiplication & Division", 3, { engine: "multiplication",
      concept: "Multiplication is equal groups. 4 × 3 means 4 groups of 3.",
      story: "Egg cartons hold 2 rows of 6. How many eggs in 3 cartons?", standards: { ccss: "3.OA.C.7" } }),
    t("division-intro", "Division as sharing", "Multiplication & Division", 3, {
      concept: "Division splits a total into equal groups. 12 ÷ 3 asks how many in each of 3 groups.",
      story: "Share 24 trading cards equally among 4 friends." }),
    t("equiv-fractions", "Equivalent fractions", "Fractions", 4, { engine: "equivalent",
      concept: "Multiplying top and bottom by the same number makes the same amount in smaller pieces.",
      story: "Half a pizza is the same as 2 slices of a pizza cut into 4.", standards: { ccss: "4.NF.A.1" } }),
    t("add-like-fractions", "Adding fractions with like denominators", "Fractions", 4, { engine: "fractionAdd", level: "easy",
      concept: "When pieces are the same size, add how many pieces you have.",
      story: "You eat 2/8 of a pizza and your brother eats 3/8.", standards: { ccss: "4.NF.B.3" } }),
    t("add-fractions", "Adding fractions", "Fractions", 5, { engine: "fractionAdd", flagship: true,
      concept: "To add fractions, the pieces must be the same size. Find a common denominator, rename, then add the numerators.",
      story: "Maya eats 3/4 of a pizza and Leo eats 1/2 of another. How much pizza did they eat together?",
      standards: { ccss: "5.NF.A.1" } }),
    t("sub-fractions", "Subtracting fractions", "Fractions", 5, { engine: "fractionSub",
      concept: "Just like adding: make the pieces the same size, then subtract the numerators.",
      story: "A ribbon is 5/6 m long. You cut off 1/3 m. How much is left?" }),
    t("decimals-intro", "Decimals and place value", "Decimals & Percentages", 4, {
      concept: "Tenths and hundredths are fractions written with a decimal point: 0.3 = 3/10.",
      story: "A sprinter runs 100 m in 12.47 seconds. What does each digit mean?" }),
    t("percent-intro", "Percent of a number", "Decimals & Percentages", 5, { engine: "percentOf",
      concept: "Percent means 'out of 100'. 25% of something is 25 out of every 100, or one quarter.",
      story: "Shoes cost $60 and are 25% off. How much do you save?" }),
    t("area-rect", "Area of rectangles", "Measurement & Geometry", 3, { engine: "areaRect",
      concept: "Area counts the unit squares that cover a shape: rows × columns.",
      story: "How much flooring does a 4 m by 3 m bedroom need?" }),
    t("word-problems-35", "Multi-step word problems", "Word Problems", 5, {
      concept: "Read, find what is asked, pick the operations, solve, then check it makes sense.",
      story: "A class raises $132 selling 44 cupcakes. What was the price of each?" }),

    // Grades 6–8
    t("ratios", "Ratios and rates", "Ratios & Proportions", 6, { engine: "ratio",
      concept: "A ratio compares two amounts. Scaling both parts by the same number keeps it the same.",
      story: "A recipe for 4 uses 2 cups of flour. How much for 10 people?" }),
    t("integers", "Adding integers", "Integers", 7, { engine: "integerAdd",
      concept: "On a number line, adding a positive moves right and adding a negative moves left.",
      story: "It is −4°C at dawn and warms up 9 degrees by noon." }),
    t("expressions", "Simplifying expressions", "Expressions & Equations", 6, {
      concept: "Combine like terms: 3x + 2x = 5x because both count x's.",
      story: "Tickets cost x dollars. Three friends buy some, then two more join." }),
    t("one-step-eq", "One- and two-step equations", "Expressions & Equations", 7, { engine: "linear",
      concept: "An equation is a balance. Do the same thing to both sides to get x alone.",
      story: "A phone plan costs $5 plus $2 per GB. You paid $17. How many GB did you use?", standards: { ccss: "7.EE.B.4" } }),
    t("inequalities", "Inequalities", "Expressions & Equations", 7, {
      concept: "Solve like an equation, but flip the sign when multiplying or dividing by a negative.",
      story: "You have $30 and games cost $8. How many can you buy?" }),
    t("probability-simple", "Simple probability", "Statistics & Probability", 7, { engine: "probability",
      concept: "Probability = favorable outcomes ÷ total outcomes, a number from 0 to 1.",
      story: "A bag has 3 red, 5 blue and 2 green marbles. What is the chance of red?" }),
    t("mean-median", "Mean, median and mode", "Statistics & Probability", 6, { engine: "mean",
      concept: "The mean shares the total equally; the median is the middle value in order.",
      story: "Find the typical score of a basketball player over five games." }),
    t("pythagoras", "The Pythagorean theorem", "Geometry", 8, {
      concept: "In a right triangle, a² + b² = c², where c is the longest side.",
      story: "How long a ladder reaches a 4 m window from 3 m away?" }),

    // Grades 9–10
    t("linear-eq", "Solving linear equations", "Algebra", 9, { engine: "linear",
      concept: "Undo operations in reverse order, keeping the equation balanced at every step.",
      story: "Compare two phone plans: $20 + $3/GB versus $35 + $1/GB. When do they cost the same?" }),
    t("systems", "Systems of equations", "Algebra", 9, {
      concept: "Two lines cross at the one point that satisfies both equations.",
      story: "Adult tickets cost $12 and child tickets $7; 20 tickets made $185." }),
    t("functions", "Functions and graphs", "Functions", 9, {
      concept: "A function gives exactly one output for each input: f(x) = 2x + 1.",
      story: "A taxi charges a base fare plus a rate per mile." }),
    t("quadratics", "Solving quadratics", "Algebra", 10, {
      concept: "Factor, complete the square, or use the quadratic formula to find where the parabola meets zero.",
      story: "When does a ball thrown upward hit the ground?" }),
    t("transformations", "Transformations", "Geometry", 10, {
      concept: "Translations slide, reflections flip, rotations turn and dilations resize.",
      story: "Design a repeating tile pattern for a bathroom floor." }),
    t("stats-9", "Data and spread", "Statistics", 10, {
      concept: "Standard deviation measures how far values typically sit from the mean.",
      story: "Which basketball player is more consistent?" }),

    // Grades 11–12
    t("trig-ratios", "Trigonometric ratios", "Trigonometry", 11, {
      concept: "In a right triangle, sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.",
      story: "Find the height of a tree from its shadow and the sun's angle." }),
    t("exp-log", "Exponential and logarithmic functions", "Exponentials & Logarithms", 11, {
      concept: "A logarithm answers 'what power?': log₂ 8 = 3 because 2³ = 8.",
      story: "How long until savings double with compound interest?" }),
    t("compound-interest", "Compound interest", "Exponentials & Logarithms", 11, { engine: "compound",
      concept: "Interest earns interest: A = P(1 + r/n)^(nt).",
      story: "You save $500 at 4% a year, compounded yearly. What do you have after 3 years?" }),
    t("limits", "Limits", "Calculus Fundamentals", 12, {
      concept: "A limit describes the value a function approaches as the input gets close to a point.",
      story: "What speed does a car's average speed approach over shorter and shorter intervals?" }),
    t("derivatives", "Derivatives as rates of change", "Calculus Fundamentals", 12, {
      concept: "The derivative is the slope of the tangent line: the instantaneous rate of change.",
      story: "How fast is water rising in a filling tank right now?" }),
    t("prob-12", "Conditional probability", "Probability & Statistics", 12, {
      concept: "P(A|B) = P(A and B) ÷ P(B): the chance of A once we know B happened.",
      story: "How likely is rain given that it is cloudy this morning?" }),
    t("precalc-functions", "Polynomial and rational functions", "Precalculus", 11, {
      concept: "End behavior, zeros and asymptotes describe the overall shape of a graph.",
      story: "Model the cost per item as a factory makes more items." }),
  ];

  const curricula = [{ id: "stepwise-core", name: "StepWise Core (Grades 1–12)", bands, topics }];

  SW.curriculum = {
    active: curricula[0],
    register(c) { curricula.push(c); },
    bands,
    bandForGrade(g) { return bands.find((b) => b.grades.includes(g)); },
    topicsForGrade(g) { return this.active.topics.filter((x) => x.grade === g); },
    domainsForGrade(g) {
      const map = new Map();
      for (const x of this.topicsForGrade(g)) {
        if (!map.has(x.domain)) map.set(x.domain, []);
        map.get(x.domain).push(x);
      }
      return map;
    },
    topic(id) { return this.active.topics.find((x) => x.id === id); },
    search(q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      const words = q.split(/\s+/);
      return this.active.topics
        .map((x) => {
          const hay = (x.title + " " + x.domain + " " + x.concept + " " + x.story).toLowerCase();
          const score = words.reduce((s, w) => s + (x.title.toLowerCase().includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0);
          return { x, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score || a.x.grade - b.x.grade)
        .map((r) => r.x);
    },
  };
})(window.StepWise = window.StepWise || {});
