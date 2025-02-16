import { query_single } from "./GPT.js";

class RelevancyEngine {
    constructor() {
        this.previousRelevancyScores = [];
    }

    /**
     * Calculates a relevancy score for a given URL, title, and HTML content
     * @param {string} usersgoal - The URL of the page
     * @param {string} url - The URL of the page
     * @param {string} title - The title of the page
     * @param {string} htmlSource - The HTML source code of the page
     * @param {number[]} previousRelevancyScores - The previous relevancy scores in the workflow
     * @returns {number} - The calculated relevancy score
     */
    async get_relevancy_score(usersgoal, url, title, htmlSource, previousRelevancyScores) {

        const sysPrompt = `
        
        <SystemPrompt>
            <Instruction>
                You are an AI designed to evaluate the **relevancy** of a webpage based on a **user-indicated goal** for their browsing session.  
                You will be provided with:
                - **<URL>**: The full URL of the webpage.  
                - **<TabTitle>**: The header title of the webpage tab.  
                - **<PageSource>**: The full HTML source code of the webpage.  
                - **<UserGoal>**: The goal the user wants to accomplish, typically expressed as a paragraph or two.
                - **<PreviousRelevancyScores>**: An ordered list of relevancy scores (0-10) of previous web pages the user has visited in their current browsing session.

        You will receive the input in user input tags:

        Your task is to analyze these inputs and assign a **Relevancy Score (0-10)** for the current webpage, where:
        - **10**: Highly relevant and essential to achieving the goal.
        - **5-9**: Somewhat relevant, contains useful information but may not be essential.
        - **1-4**: Minimally relevant, tangential or indirectly related.
        - **0**: Completely irrelevant.

        <ScoringCriteria>
            1. **Direct Content Match**  
               - If the page **directly contributes** to achieving the user goal, look to assign a high score, but take other criteria into factor.
               - If the page contains **related but non-essential** information, look to assign a moderate score, but take other criteria into factor.
               - If the page has no relation, look to assign a low or zero score, but take other criteria into factor.
            2. **Resource Utility**  
               - If the page is a **search engine, content aggregator, or resource hub** (e.g., Google, YouTube, Wikipedia), it is **not automatically irrelevant**.  
               - Consider the **trend** of the user's previous browsing session list of relevancy scores. If the user has been visiting pages that are **relevant** to their goal, a content aggregator (e.g., Google Search) can be useful and assign a moderate to high score. However, if the user's browsing history contains **irrelevant or off-topic pages**, the likelihood of the user searching for unrelated information increases, which might decrease the relevancy of the search engine or resource hub.  
               - Assign a **moderate score** if it serves as a means to access relevant content, but it should be considered with respect to the user's **historical behavior**.  

                Also recognize that some content aggregators and search engines may be more niche and specialized than others. YouTube, Wikipedia, and Google are generic enough to where they are typically more relevant than more niche websites such as Amazon or a specific search engine for specific topics, which may not be pertinent to the user’s goal. 

            3. **Distraction Factor**  
               - If the page contains **off-topic entertainment or discussion** (e.g., a Reddit forum about cats when researching Machiavelli), assign a low score.  

            4. **Session Context**  
               - Consider whether the page is **part of a user’s research workflow** (e.g., searching for articles before opening them).  
            
        </ScoringCriteria>

        <OutputFormat>
            Your output should follow this structure:  
            
            <RelevancyScore>X</RelevancyScore>  
            <Justification>Brief reasoning based on the criteria.</Justification>
        </OutputFormat>
    </Instruction>

    <Examples>
        <Example>
            <UserGoal>I need to write an essay on Machiavelli and his influence on the political landscape of Italy during his time.</UserGoal>
            <URL>https://plato.stanford.edu/entries/machiavelli/</URL>
            <TabTitle>Machiavelli (Stanford Encyclopedia of Philosophy)</TabTitle>
            <PageSource>...</PageSource>
            <PreviousRelevancyScores>
                <Score>10</Score>
                <Score>8</Score>
            </PreviousRelevancyScores>
            <ExpectedOutput>
                <RelevancyScore>10</RelevancyScore>
                <Justification>This page provides a direct academic analysis of Machiavelli's philosophy.</Justification>
            </ExpectedOutput>
        </Example>

        <Example>
            <UserGoal>I need to learn how to create recursive functions in C++..</UserGoal>
            <URL>https://www.reddit.com/r/cats</URL>
            <TabTitle>Reddit - Cats</TabTitle>
            <PageSource>...</PageSource>
            <PreviousRelevancyScores>
                <Score>10</Score>
                <Score>7</Score>
            </PreviousRelevancyScores>
            <ExpectedOutput>
                <RelevancyScore>0</RelevancyScore>
                <Justification>Completely unrelated to recursion in C++.</Justification>
            </ExpectedOutput>
        </Example>

        <Example>
            <UserGoal>I need to learn and commit to memory the appearances, names, and uses of various dental instruments that a dentist may see daily.</UserGoal>
            <URL>https://www.youtube.com/</URL>
            <TabTitle>YouTube</TabTitle>
            <PageSource>...</PageSource>
            <PreviousRelevancyScores>
                <Score>10</Score>
                <Score>9</Score>
            </PreviousRelevancyScores>
            <ExpectedOutput>
                <RelevancyScore>7</RelevancyScore>
                <Justification>While YouTube may not necessarily be exactly relevant to the goal, the user’s previous relevancy scores indicate a trend of staying on task and being focused. .</Justification>
            </ExpectedOutput>
        </Example>

        <Example>
            <UserGoal>I need to find and reach out to professors at my university and email them about research opportunities for genetics engineering.</UserGoal>
            <URL>https://www.google.com/</URL>
            <TabTitle>Google</TabTitle>
            <PageSource>...</PageSource>
            <PreviousRelevancyScores>
                <Score>4</Score>
                <Score>3</Score>
            </PreviousRelevancyScores>
            <ExpectedOutput>
                <RelevancyScore>5</RelevancyScore>
                <Justification>The site Google could be used to navigate to both relevant and non-relevant sites. However, based on the user’s workflow so far, as seen through PreviousRelevancyScores, we can see they’ve been off-topic, so we can assume that their search on Google may not be so relevant.</Justification>
            </ExpectedOutput>
        </Example>
    </Examples>
    </SystemPrompt>
`

        const response = await query_single("You are a helpful assistant.", sysPrompt + "  Your input is as follows: <UserGoal>" + usersgoal + "<UserGoal/><url>" + url + "<url/>" + "<TabTitle>" + title + "<TabTitle/><PageSource>" + htmlSource + "<PageSource/><PreviousRelevancyScore>" + previousRelevancyScores + "<PreviousRelevancyScore/>");
        const responseContent = response.content;

        const scoreMatch = responseContent.match(/<RelevancyScore>(\d+)<\/RelevancyScore>/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

        // Append score to previous scores
        this.previousRelevancyScores.push(score);

        return score;
    }
}

export default RelevancyEngine;

