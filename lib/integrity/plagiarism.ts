
/**
 * Plagiarism Detection Service (Mock)
 * 
 * This service mocks the behavior of tools like Turnitin or iThenticate.
 * In a production environment, this would make HTTP calls to their respective APIs.
 */

interface PlagiarismResult {
    score: number;       // Percentage 0-100
    reportUrl: string;   // Link to full report
    status: 'completed' | 'pending' | 'failed';
}

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
    console.log("[Plagiarism] Analyzing text length:", text.length);

    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Logic: Generate a random reasonable score (0-25%)
    // Occasionally generate a high score for testing "Red" status
    const isProblematic = Math.random() > 0.9;
    const score = isProblematic
        ? Math.floor(Math.random() * 40) + 20 // 20-60%
        : Math.floor(Math.random() * 15);     // 0-15%

    const reportUrl = `https://mock-integrity-service.com/report/${Date.now()}`;

    return {
        score,
        reportUrl,
        status: 'completed'
    };
}
