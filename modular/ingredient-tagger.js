// ingredient-tagger.js
// Core ingredient tagging engine with Fuse, Compromise, Natural, and Lodash

import Fuse from 'fuse.js';
import nlp from 'compromise';
import _ from 'lodash';
// Note: 'natural' is Node-focused and not browser-native; include only if server-side

// === Example tag dictionaries ===
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

// === Create Fuse.js instances per tag ===
const fuseMaps = {};
Object.entries(ingredientTags).forEach(([tag, terms]) => {
  fuseMaps[tag] = new Fuse(terms, {
    includeScore: true,
    threshold: 0.3 // adjust for sensitivity
  });
});

// === Tag ingredients based on fuzzy matching ===
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

// === NLP-based parsing (Compromise) ===
export function extractNouns(ingredientLine) {
  const doc = nlp(ingredientLine);
  return doc.nouns().out('array');
}

// === Lodash utility examples ===
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

// === Example usage ===
// const tags = tagIngredients(["Chicken Fat", "Salmon Oil", "Sweet Potato"]);
// const formula = { id: 'f001', ingredients: [...], tags };
