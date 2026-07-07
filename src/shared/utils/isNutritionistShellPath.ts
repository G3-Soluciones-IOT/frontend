const nutritionistShellPrefixes = [
  "/nutritionist",
  "/communication",
  "/analytics",
];

export function isNutritionistShellPath(path: string) {
  return nutritionistShellPrefixes.some((prefix) => path.startsWith(prefix));
}

