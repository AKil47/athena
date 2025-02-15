class RelevancyEngine {
    constructor() {
        this.previousRelevancyScores = [];
    }

    /**
     * Calculates a relevancy score for a given URL, title, and HTML content
     * @param {string} url - The URL of the page
     * @param {string} title - The title of the page
     * @param {string} htmlSource - The HTML source code of the page
     * @returns {number} - The calculated relevancy score
     */
    get_relevancy_score(url, title, htmlSource) {
        // TODO: Implement relevancy scoring logic here
        const score = 0; // Placeholder score

        // Append score to previous scores
        this.previousRelevancyScores.push(score);

        return score;
    }
}

export default RelevancyEngine;

