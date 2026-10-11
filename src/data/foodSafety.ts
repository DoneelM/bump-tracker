/**
 * Food safety in pregnancy, from New Zealand Food Safety (MPI), "List of safe food in pregnancy"
 * (source id `mpi-food-pregnancy`, checked 11/10/2026). Advice wording follows MPI closely; don't
 * change it from memory. Keep `docs/SOURCES.md` in sync.
 */

export type FoodVerdict = 'ok' | 'care' | 'cooked' | 'avoid';

export const VERDICT_LABEL: Record<FoodVerdict, string> = {
  ok: 'OK to eat',
  care: 'Take care',
  cooked: 'Only if cooked',
  avoid: 'Don’t eat',
};

export interface FoodItem {
  food: string;
  /** Examples MPI gives, to help search. */
  examples?: string;
  verdict: FoodVerdict;
  advice: string;
}

export interface FoodGroup {
  title: string;
  items: readonly FoodItem[];
}

export const FOOD_SOURCE_ID = 'mpi-food-pregnancy';

export const FOOD_GROUPS: readonly FoodGroup[] = [
  {
    title: 'Breads and cereals',
    items: [
      { food: 'Bread', examples: 'all types', verdict: 'ok', advice: 'OK to eat.' },
      { food: 'Cakes, slices and muffins', examples: 'plain', verdict: 'ok', advice: 'OK to eat.' },
      {
        food: 'Cakes with cream or custard',
        verdict: 'avoid',
        advice: 'Don’t eat, unless the cream is newly opened and the custard is home-made and fresh.',
      },
      {
        food: 'Breakfast cereals, rice and pasta',
        verdict: 'ok',
        advice: 'OK to eat. See milk for advice on milk. This doesn’t cover filled fresh pasta; check the filling.',
      },
    ],
  },
  {
    title: 'Dairy',
    items: [
      {
        food: 'Soft cheese',
        examples: 'brie, camembert, blue, ricotta, paneer, mozzarella, feta, haloumi',
        verdict: 'cooked',
        advice: 'Low-acid soft pasteurised cheese: don’t eat unless cooked.',
      },
      { food: 'Hard cheese', examples: 'cheddar, parmesan', verdict: 'ok', advice: 'OK to eat. Store in the fridge.' },
      {
        food: 'Cottage cheese and cream cheese',
        examples: 'pasteurised',
        verdict: 'care',
        advice: 'Buy in sealed packs. Eat cold within 2 days of opening, or cooked until the best-before date.',
      },
      { food: 'Butter', examples: 'all types', verdict: 'ok', advice: 'OK to eat. Store in the fridge.' },
      {
        food: 'Cream',
        examples: 'fresh, whipped, sour cream',
        verdict: 'care',
        advice: 'Buy in sealed packs, keep in the fridge in the original pack, and eat within 2 days of opening.',
      },
      {
        food: 'Custard, ready-made chilled',
        verdict: 'care',
        advice: 'Keep in the fridge in the original pack and eat within 2 days of opening.',
      },
      {
        food: 'Custard, home-made',
        verdict: 'care',
        advice: 'Eat hot straight after cooking. Reheat leftovers until piping hot (over 75°C) and eat straight away.',
      },
      {
        food: 'Milk',
        examples: 'pasteurised',
        verdict: 'care',
        advice: 'Keep in the fridge in the original pack, don’t contaminate the lid, and use before the best-before date.',
      },
      { food: 'Ice cream, packaged', verdict: 'ok', advice: 'OK to eat.' },
      { food: 'Soft-serve ice cream', verdict: 'avoid', advice: 'Don’t eat.' },
      { food: 'Yoghurt', examples: 'pasteurised', verdict: 'ok', advice: 'Follow the maker’s advice on the pack.' },
      {
        food: 'Raw (unpasteurised) milk and dairy',
        examples: 'raw milk cheese, cream, yoghurt',
        verdict: 'avoid',
        advice: 'Don’t eat.',
      },
    ],
  },
  {
    title: 'Eggs',
    items: [
      {
        food: 'Raw eggs',
        examples: 'egg flip, eggnog, smoothies, home-made mayonnaise and dressings, home-made ice cream, mousse, tiramisu',
        verdict: 'avoid',
        advice: 'Don’t eat.',
      },
      {
        food: 'Cooked eggs',
        examples: 'fried, scrambled, baked, poached',
        verdict: 'care',
        advice: 'Cook well: firm yolks, firm scrambled eggs.',
      },
    ],
  },
  {
    title: 'Meat and poultry',
    items: [
      {
        food: 'Cooked meat',
        examples: 'beef, pork, chicken, mince, sausages',
        verdict: 'care',
        advice:
          'Cook until piping hot throughout and the juices run clear. Eat hot; never rare or undercooked. Keep leftovers covered in the fridge, eat within 2 days, and reheat until piping hot (over 75°C).',
      },
      {
        food: 'Processed meats',
        examples: 'ham, salami, luncheon, pâté, pastrami, biltong, jerky',
        verdict: 'cooked',
        advice: 'Don’t eat unless heated until piping hot (over 75°C).',
      },
      {
        food: 'Cold cooked chicken or turkey',
        examples: 'any cold pre-cooked poultry',
        verdict: 'cooked',
        advice: 'Don’t eat unless heated until piping hot (over 75°C).',
      },
      {
        food: 'Raw meat and poultry',
        verdict: 'avoid',
        advice: 'Don’t eat or taste. Don’t touch your face while preparing it, and wash and dry your hands well after.',
      },
    ],
  },
  {
    title: 'Seafood',
    items: [
      { food: 'Raw fish', examples: 'including marinated raw fish', verdict: 'avoid', advice: 'Don’t eat.' },
      { food: 'Raw shellfish', examples: 'including marinated raw mussels', verdict: 'avoid', advice: 'Don’t eat.' },
      {
        food: 'Smoked or chilled pre-cooked seafood',
        examples: 'smoked salmon, mussels, oysters, scallops, crayfish, prawns',
        verdict: 'cooked',
        advice: 'Don’t eat unless heated until piping hot (over 75°C).',
      },
      {
        food: 'Freshly cooked seafood',
        examples: 'fish, mussels, oysters, crayfish, scallops',
        verdict: 'care',
        advice: 'Cook thoroughly until piping hot (over 75°C) throughout. Eat hot.',
      },
      {
        food: 'Bluff and Pacific oysters, queen scallops',
        verdict: 'care',
        advice: 'Higher in cadmium: MPI suggests these only once a month in pregnancy.',
      },
    ],
  },
  {
    title: 'Fruit, vegetables and salads',
    items: [
      {
        food: 'Fresh fruit',
        verdict: 'care',
        advice: 'Wash and dry well just before eating. Wash and dry whole melons before cutting.',
      },
      { food: 'Frozen berries', examples: 'including imported', verdict: 'cooked', advice: 'Cook before eating.' },
      {
        food: 'Fresh vegetables',
        verdict: 'care',
        advice: 'Wash and dry well just before eating raw, or wash before cooking.',
      },
      { food: 'Frozen vegetables', verdict: 'cooked', advice: 'Cook. Don’t eat them uncooked.' },
      {
        food: 'Pre-made and pre-packed salads',
        examples: 'mesclun, spinach, coleslaw, pasta, rice and fruit salads from delis, salad bars and supermarkets',
        verdict: 'avoid',
        advice: 'Don’t eat.',
      },
      { food: 'Dried herbs', verdict: 'cooked', advice: 'Cook thoroughly.' },
      { food: 'Fresh herbs', verdict: 'care', advice: 'Wash well before using.' },
      {
        food: 'Sprouts and enoki mushrooms',
        examples: 'alfalfa, mung bean, lentil, chickpea, broccoli, radish, pea, snow pea, adzuki',
        verdict: 'cooked',
        advice: 'Don’t eat unless cooked.',
      },
    ],
  },
  {
    title: 'Other foods',
    items: [
      {
        food: 'Leftovers',
        verdict: 'care',
        advice: 'Keep covered in the fridge, eat within 2 days, and reheat until piping hot (over 75°C). Never eat cold leftovers.',
      },
      {
        food: 'Canned food',
        examples: 'fruit, vegetables, fish, meat, sauces',
        verdict: 'care',
        advice: 'Take it out of the can to store. Keep leftovers covered in the fridge and eat within 2 days.',
      },
      {
        food: 'Sauces, dressings and spreads',
        examples: 'bought mayonnaise, tomato sauce, oil and vinegar dressing, margarine',
        verdict: 'care',
        advice: 'Keep in the fridge once opened and check how long they keep.',
      },
      { food: 'Sushi, store-bought', examples: 'all types, even without raw seafood', verdict: 'avoid', advice: 'Don’t eat.' },
      {
        food: 'Sushi, home-made',
        verdict: 'care',
        advice: 'Use freshly cooked rice and no raw or cold cooked meat or seafood. Eat straight away; no leftovers.',
      },
      {
        food: 'Stuffing from chicken or turkey',
        verdict: 'care',
        advice: 'Only if cooked separately in a dish. Eat hot; leftovers in the fridge within 2 days, reheated until piping hot.',
      },
      { food: 'Hummus and dips with tahini', examples: 'store-bought or home-made', verdict: 'avoid', advice: 'Don’t eat.' },
      {
        food: 'Brown seaweed',
        examples: 'kelp, kombu, wakame, arame, hijiki',
        verdict: 'care',
        advice: 'Very high in iodine: limit to 1 serve a week.',
      },
      {
        food: 'Red or green seaweed',
        examples: 'nori, karengo, dulse',
        verdict: 'ok',
        advice: 'OK to eat. See sushi.',
      },
      {
        food: 'Juice, kombucha and cider (non-alcoholic), pasteurised',
        verdict: 'ok',
        advice: 'OK to drink.',
      },
      { food: 'Unpasteurised (raw) juice, kombucha or cider', verdict: 'avoid', advice: 'Don’t drink.' },
    ],
  },
];

/** MPI's fish servings to keep mercury down, by species. */
export const FISH_SERVINGS: readonly { advice: string; fish: readonly string[] }[] = [
  {
    advice: 'No limit needed',
    fish: [
      'Anchovy', 'Arrow squid', 'Barracouta', 'Blue cod', 'Brill/turbot', 'Brown trout (not Lake Ellesmere)', 'Cockles',
      'Eel', 'Elephant fish', 'Flounder', 'Gemfish', 'Gurnard', 'Hoki', 'John Dory', 'Ling', 'Monkfish/stargazer',
      'Mussels', 'Orange perch', 'Orange roughy', 'Oreo dories', 'Oysters (not Bluff or Pacific)', 'Parore',
      'Scallops (not queen)', 'Rainbow trout (non-geothermal regions)', 'Skipjack tuna', 'Smooth oreo',
      'Sole (not lemon sole)', 'Southern blue whiting', 'Surf clams (tuatua)', 'Tarakihi', 'Antarctic toothfish',
      'Warehou', 'Whitebait (inanga)',
    ],
  },
  {
    advice: '3 to 4 servings a week',
    fish: [
      'Albacore tuna', 'Alfonsino', 'Bass', 'Bluenose', 'Ghost shark', 'Hake', 'Hāpuku (groper)', 'Javelin fish',
      'Kahawai', 'Kingfish', 'Lake Taupō trout', 'Leatherjacket', 'Lemon sole', 'Mackerel', 'Red cod', 'Ribaldo',
      'Rig (lemonfish)', 'Rock lobster', 'Salmon (farmed)', 'Sea perch', 'Silverside', 'Skate', 'Snapper', 'Sprats',
      'Trevally',
    ],
  },
  {
    advice: '1 serving every 1 to 2 weeks',
    fish: [
      'Cardinal fish', 'Dogfish (not rig)', 'Lake Rotomahana trout', 'Trout from geothermal lakes', 'School shark',
      'Striped marlin', 'Southern bluefin tuna', 'Swordfish',
    ],
  },
];

/** Case- and accent-insensitive match on food, examples and advice. Empty query matches everything. */
export function filterFoods(groups: readonly FoodGroup[], query: string): FoodGroup[] {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const q = fold(query.trim());
  if (!q) return [...groups];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => fold(`${i.food} ${i.examples ?? ''} ${i.advice}`).includes(q)) }))
    .filter((g) => g.items.length > 0);
}

export function filterFish(query: string): typeof FISH_SERVINGS {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const q = fold(query.trim());
  if (!q) return FISH_SERVINGS;
  return FISH_SERVINGS.map((b) => ({ ...b, fish: b.fish.filter((f) => fold(f).includes(q)) })).filter((b) => b.fish.length > 0);
}
