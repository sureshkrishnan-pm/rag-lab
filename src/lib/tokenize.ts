// A short, unremarkable stopword list. Removing these keeps BM25's IDF
// weighting cleaner and, more importantly, stops the extractive-answer
// heuristic from treating "the"/"a"/"for" as evidence of relevance.
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "with", "by", "from", "as",
  "and", "or", "but", "if", "that", "this", "these", "those", "it", "its",
  "into", "about", "than", "then", "so", "such", "can", "could", "will",
  "would", "should", "may", "might", "not", "no", "do", "does", "did",
  "has", "have", "had", "what", "which", "who", "whom", "how", "when",
  "where", "why", "s", "t", "re", "ve", "ll", "d", "m",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}
