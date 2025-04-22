// ingredient-tagger.js
import Fuse from 'https://cdn.skypack.dev/fuse.js';
import nlp from 'https://cdn.skypack.dev/compromise';
import _ from 'https://cdn.skypack.dev/lodash-es';

export const ingredientTags = {
  poultry: ["chicken", "turkey", "duck", "chicken fat", "natural chicken flavor"],
  fish: ["salmon", "whitefish", "anchovy", "menhaden fish oil"],
  grain: ["rice", "barley", "sorghum", "corn gluten meal"],
  legumes: ["peas", "lentils", "chickpeas", "soy"],
  fatsAndOils: ["chicken fat", "salmon oil", "canola oil"],
  protein: ["beef", "lamb", "bison", "egg", "rabbit"],
  contentious: ["pea protein", "corn", "soy", "by-product"],
  fruitAndVeg: ["apple", "carrot", "sweet potato", "pumpkin", "spinach"]
};

const fuseMaps = {};
Object.entries(ingredientTags).forEach(([tag, terms]) => {
  fuseMaps[tag] = new Fuse(terms, {
    includeScore: true,
    threshold: 0.3
  });
});

export function tagIngredients(rawIngredients) {
  const tags = new Set();
  rawIngredients.forEach(raw => {
    const ing = raw.toLowerCase();
    for (const [tag, fuse] of Object.entries(fuseMaps)) {
      const result = fuse.search(ing);
      if (result.length > 0 && result[0].score < 0.3) {
        tags.add(tag);
      }
    }
  });
  return Array.from(tags);
}

export function extractNouns(ingredientLine) {
  const doc = nlp(ingredientLine);
  return doc.nouns().out('array');
}

export function groupFormulasByTag(formulas, tag) {
  return _.groupBy(formulas, f => f.tags.includes(tag));
}

export function filterFormulas(formulas, requiredTags = [], excludedTags = []) {
  return formulas.filter(f => {
    const hasRequired = requiredTags.every(tag => f.tags.includes(tag));
    const hasExcluded = excludedTags.some(tag => f.tags.includes(tag));
    return hasRequired && !hasExcluded;
  });
}