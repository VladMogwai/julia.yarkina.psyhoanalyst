/**
 * Phones: moving on and back through a topic keeps how far each question was opened.
 *   node scripts/check/phone-back.mjs [lang] [base]
 */
import { openQuiz } from "./quiz.mjs";

const [lang = "uk", base] = process.argv.slice(2);
const quiz = await openQuiz({ lang, device: "phone", base });
await quiz.chooseTopic(0);

for (let question = 0; question < 2; question++) {
  for (let step = 0; step < 4; step++) await quiz.forward();
  await quiz.swipe(-1);
}
await quiz.forward();
await quiz.forward();
console.log("q3, 2 steps open:", await quiz.card());
await quiz.swipe(1);
console.log("back to q2 (4 steps):", await quiz.card());
await quiz.swipe(1);
console.log("back to q1 (4 steps):", await quiz.card());
await quiz.swipe(-1);
await quiz.swipe(-1);
console.log("forward to q3 (2 steps):", await quiz.card());
console.log("errors:", quiz.errors);
await quiz.close();
