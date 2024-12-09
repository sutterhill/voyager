export function performCosineSimilarity(links: string[], searchQuery: string) {
    try {
        const cosineSimilarity = (vec1: number[], vec2: number[]): number => {
            const maxLength = Math.max(vec1.length, vec2.length);
            const paddedVec1 = [...vec1, ...Array(maxLength - vec1.length).fill(0)];
            const paddedVec2 = [...vec2, ...Array(maxLength - vec2.length).fill(0)];
            
            const dotProduct = paddedVec1.reduce((sum, val, i) => sum + val * paddedVec2[i], 0);
            const magnitude1 = Math.sqrt(
                paddedVec1.reduce((sum, val) => sum + val * val, 0)
            );
            const magnitude2 = Math.sqrt(
                paddedVec2.reduce((sum, val) => sum + val * val, 0)
            );
            if (magnitude1 === 0 || magnitude2 === 0) return 0;
            return dotProduct / (magnitude1 * magnitude2);
        };

        const textToVector = (text: string): number[] => {
            const words = searchQuery.toLowerCase().split(/\W+/);
            return words.map((word) => {
                const count = (text.toLowerCase().match(new RegExp(word, "g")) || [])
                    .length;
                return count / text.length;
            });
        };

        interface ScoredLink {
            link: string;
            score: number;
        }

        // Calculate all scores first
        const scoredLinks: ScoredLink[] = links.map((link, index) => {
            const linkVector = textToVector(link);
            const searchVector = textToVector(searchQuery);
            return {
                link,
                score: cosineSimilarity(linkVector, searchVector)
            };
        });

        // Sort the scored links
        const sortedLinks = scoredLinks.sort((a, b) => b.score - a.score);

        return sortedLinks.map(item => item.link);
    } catch (error) {
        return links;
    }
}
