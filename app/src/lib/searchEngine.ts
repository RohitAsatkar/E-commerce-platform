import type { Product } from './useProducts';

// Hardcoded synonym mapping dictionary
const SYNONYMS: Record<string, string> = {
  "shades": "sunglasses",
  "phone": "mobile",
  "watch": "timepiece",
  "shoes": "footwear",
  "boots": "footwear",
  "tee": "t-shirt",
  "tshirt": "t-shirt",
  "jacket": "overshirts",
  "coat": "overshirts",
  "trousers": "pants",
  "cargo": "pants",
  "belt": "accessories",
  "bag": "accessories",
  "necklace": "accessories",
  "scarf": "accessories"
};

/**
 * Normalizes text by converting to lowercase and stripping special characters/punctuation.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein distance between two words.
 */
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates a match score for a product against a search query.
 * Returns 0 if there is no match, or a positive score value representing the match quality.
 */
export function calculateMatchScore(product: Product, queryTokens: string[]): number {
  const nameNorm = normalizeText(product.name);
  const descNorm = normalizeText(product.description || '');
  const catNorm = normalizeText(product.category || '');
  const tagsNorm = (product.tags || []).map(t => normalizeText(t));

  const nameWords = nameNorm.split(' ');
  const descWords = descNorm.split(' ');

  let score = 0;

  for (const qToken of queryTokens) {
    let tokenScore = 0;

    // 1. Exact or prefix match in Name
    if (nameNorm.includes(qToken)) {
      tokenScore += 10;
      // Bonus if it matches a whole word exactly
      if (nameWords.includes(qToken)) {
        tokenScore += 5;
      }
    }

    // 2. Exact match in Category or Tags
    if (catNorm === qToken || tagsNorm.includes(qToken)) {
      tokenScore += 8;
    }

    // 3. Exact or prefix match in Description
    if (descNorm.includes(qToken)) {
      tokenScore += 4;
      if (descWords.includes(qToken)) {
        tokenScore += 2;
      }
    }

    // 4. Fuzzy Matching / Typo Tolerance (Levenshtein Distance)
    // Only perform fuzzy check on tokens of length >= 3 to avoid false positives
    if (qToken.length >= 3) {
      // Check Name words
      for (const nameWord of nameWords) {
        if (nameWord.length >= 3) {
          const dist = getLevenshteinDistance(qToken, nameWord);
          // Allow 1 typo for words < 6 chars, 2 typos for longer words
          const maxAllowedTypos = qToken.length >= 6 ? 2 : 1;
          if (dist <= maxAllowedTypos) {
            const similarity = 1 - dist / Math.max(qToken.length, nameWord.length);
            tokenScore += similarity * 6; // up to 6 points for high similarity
          }
        }
      }

      // Check Category
      const catDist = getLevenshteinDistance(qToken, catNorm);
      if (catDist <= 1) {
        tokenScore += 4;
      }
    }

    score += tokenScore;
  }

  return score;
}

/**
 * Deterministically gets product rating for ranking engine.
 */
function getProductRating(product: Product): number {
  if ('rating' in product) return (product as any).rating || 0;
  
  // Deterministic fallback rating mapping based on standard ID prefixes
  const ratingsMap: Record<string, number> = {
    'm1': 4.8, 'm2': 4.9, 'm3': 4.2, 'm4': 4.5, 'm5': 4.7,
    'm6': 4.6, 'm7': 4.4, 'm8': 4.3, 'm9': 4.1, 'm10': 4.7,
    'm11': 4.2, 'a1': 4.8, 'a2': 4.9, 'a3': 4.6, 'a4': 4.3,
    'a5': 4.5, 'a6': 4.8, 'a7': 4.7, 'a8': 4.4, 'a9': 4.1,
    'a10': 4.5, 'a11': 4.3
  };
  return ratingsMap[product.id] || 4.0;
}

/**
 * The Backend search controller pipeline and Ranking engine logic.
 * Processes query (normalizes + maps synonyms) and returns a sorted/ranked list of products.
 */
export function searchProducts(products: Product[], rawQuery: string): Product[] {
  if (!rawQuery || rawQuery.trim() === '') return [];

  // PHASE 2: Backend Pipeline (Processing the Query)
  
  // 1. Normalization: lowercase + strip special chars
  const normalizedQuery = normalizeText(rawQuery);
  if (normalizedQuery === '') return [];

  // 2. Synonym Mapping
  const queryWords = normalizedQuery.split(' ');
  const finalQueryTokens = [...queryWords];

  for (const word of queryWords) {
    if (SYNONYMS[word]) {
      finalQueryTokens.push(SYNONYMS[word]);
    }
  }

  // 3. Score & Filter
  type ScoredProduct = {
    product: Product;
    textScore: number;
    rating: number;
    isOutOfStock: boolean;
  };

  const scoredList: ScoredProduct[] = [];

  for (const product of products) {
    const textScore = calculateMatchScore(product, finalQueryTokens);
    
    // Only include if there is some textual match
    if (textScore > 0) {
      const rating = getProductRating(product);
      // Let's assume stock is available if undefined or > 0
      const isOutOfStock = product.stock === 0;

      scoredList.push({
        product,
        textScore,
        rating,
        isOutOfStock
      });
    }
  }

  // PHASE 3: The Ranking Engine (Sorting the Results)
  scoredList.sort((a, b) => {
    // Rule C: Availability (Push Out-of-Stock items to the absolute bottom)
    if (a.isOutOfStock && !b.isOutOfStock) return 1;
    if (!a.isOutOfStock && b.isOutOfStock) return -1;

    // Rule A: Text Match (Primary factor)
    // If scores differ significantly, sort by score
    if (Math.abs(a.textScore - b.textScore) > 0.01) {
      return b.textScore - a.textScore;
    }

    // Rule B: Rating / Bestseller Boost (Give a slight sorting boost to items with higher ratings)
    // If text match score is equal/close, sort by rating
    if (Math.abs(a.rating - b.rating) > 0.01) {
      return b.rating - a.rating;
    }

    // Fallback: alphabetical order
    return a.product.name.localeCompare(b.product.name);
  });

  return scoredList.map(item => item.product);
}
