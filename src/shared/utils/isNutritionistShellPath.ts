const nutritionistShellPrefixes = [
  "/nutritionist",
  "/communication",
  "/content",
  "/analytics",
  "/subscriptions",
];

export function isNutritionistShellPath(path: string) {
  return nutritionistShellPrefixes.some((prefix) => path.startsWith(prefix));
}

