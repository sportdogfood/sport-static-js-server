// ingredient-tagger.js
import Fuse from 'https://cdn.skypack.dev/fuse.js';
import nlp  from 'https://cdn.skypack.dev/compromise';
import _    from 'https://cdn.skypack.dev/lodash-es';
import { ingredientAlternates } from './ingredient-alternates.js';

// 1) Build alternates Fuse index for normalization
const altIndex = [];
ingredientAlternates.forEach(item => {
  item.masterMatch.forEach(mterm => {
    altIndex.push({ term: mterm.toLowerCase(), slug: item.slug, name: item.name });
  });
});
const altFuse = new Fuse(altIndex, {
  keys: ['term'],
  threshold: 0.2,
  ignoreLocation: true,
  includeScore: true
});

// 2) Your existing category → keyword lists
export const ingredientTags = {
  poultry: [...],
  fish:    [...],
  grain:   [...],
  // etc
};
// Build category Fuse maps
const fuseMaps = {};
Object.entries(ingredientTags).forEach(([tag, terms]) => {
  fuseMaps[tag] = new Fuse(terms, { includeScore: true, threshold: 0.3 });
});

/**
 * Normalize each raw ingredient string against ingredientAlternates.
 * Returns the slug if matched, otherwise rawLine.
 */
export function normalizeIngredient(rawLine) {
  const lookup = rawLine.toLowerCase();
  const results = altFuse.search(lookup);
  if (results.length && results[0].score < 0.2) {
    return results[0].item.slug;
  }
  return rawLine.trim();
}

/**
 * Given an array of raw ingredient lines:
 * - Returns { recognized: [...], unrecognized: [...] }
 * - recognized: normalized slugs
 * - unrecognized: original lines with no match
 */
export function normalizeIngredients(rawIngredients) {
  const recognized = [];
  const unrecognized = [];

  rawIngredients.forEach(raw => {
    const norm = normalizeIngredient(raw);
    if (ingredientAlternates.some(i => i.slug === norm)) {
      recognized.push(norm);
    } else {
      unrecognized.push(raw.trim());
    }
  });

  return { recognized, unrecognized };
}

/**
 * Tag recognized ingredients by category
 */
export function tagIngredients(rawIngredients) {
  // First normalize all
  const { recognized } = normalizeIngredients(rawIngredients);
  const tags = new Set();

  recognized.forEach(norm => {
    for (const [tag, fuse] of Object.entries(fuseMaps)) {
      const result = fuse.search(norm);
      if (result.length && result[0].score < 0.3) {
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
    const hasRequired = requiredTags.every(t => f.tags.includes(t));
    const hasExcluded = excludedTags.some(t => f.tags.includes(t));
    return hasRequired && !hasExcluded;
  });
}
