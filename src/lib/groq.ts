/**
 * Groq AI Service
 * Handles communication with the Groq Cloud API for report analysis.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export async function getGroqAnalysis(data: unknown, type: 'teacher' | 'observation' | 'admin'): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        console.warn("Groq API Key not found. Using mock analysis mode.");
        return getMockAnalysis(type, data);
    }

    const systemPrompt = `You are an expert Educational Data Analyst. 
Analyze the provided JSON data and provide a concise, professional summary with:
1. Key Strengths
2. Areas for Growth
3. Actionable Recommendations

Format the output in clear Markdown with appropriate headers. Keep it professional and encouraging.`;

    const userPrompt = `Please analyze this ${type} report data: ${JSON.stringify(data, null, 2)}`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to fetch from Groq API");
        }

        const result: GroqResponse = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error("Groq Analysis Error:", error);
        throw error;
    }
}

async function getMockAnalysis(type: string, data: any): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (type === 'observation') {
        return `## Observation Analysis Summary

### Key Strengths
- **Instructional Clarity**: The teacher demonstrated strong command over the subject matter, using clear and precise language that facilitated student understanding.
- **Student Engagement**: High levels of active participation were noted, with the teacher effectively using open-ended questioning to stimulate critical thinking.
- **Classroom Climate**: A positive and respectful environment was maintained, encouraging students to take risks and contribute to discussions.

### Areas for Growth
- **Pacing**: Transition between the guided practice and independent work felt slightly rushed for some students.
- **Check for Understanding**: While questioning was good, more frequent "stop and check" moments could ensure the entire class is on the same page before moving to complex tasks.

### Actionable Recommendations
1. **Scaffold Transitions**: Incorporate a 2-minute "re-cap" bridge between major lesson segments.
2. **Inclusive Participation**: Use a "cold call" or randomized selection method to ensure engagement extends beyond the most vocal students.
3. **Data-Driven Adjustment**: Use the exit ticket data immediately to group students for the next session's differentiated support.`;
    }

    if (type === 'teacher') {
        const name = (data as any)?.name || "the teacher";
        return `## Comprehensive Performance Profile: ${name}

### Strategic Strengths
- **Consistency**: High average scores across all domains indicate a stable and reliable instructional practice.
- **Professional Growth**: The significant number of PD hours (32h) shows a strong commitment to continuous improvement.
- **Instructional Delivery**: Particularly strong in "Instructional Delivery", consistently achieving proficient to exemplary ratings.

### Growth Opportunities
- **Differentiated Assessment**: While instruction is strong, adapting assessment strategies for diverse learners is an area for targeted development.
- **Goal Alignment**: Some development goals are nearing their due dates (e.g., "Instructional Clarity"); focused effort here will complete the current growth cycle.

### Strategic Recommendations
1. **Peer Mentorship**: Leverage strengths in instructional delivery by leading a "best practices" session for the department.
2. **Assessment Workshop**: Prioritize the upcoming "Digital Literacy" workshop to enhance assessment متنوع (diversity).
3. **Reflective Practice**: Continue the high-quality self-reflections, as they show deep alignment with the Danielson framework.`;
    }

    return `## Admin Strategic Overview

### Key Institutional Trends
- **High Overall Performance**: The team is performing at a strong average of 3.8/5.0 across all instructional domains.
- **Culture of Growth**: 85% of staff are actively meeting or exceeding their PD hour targets for the term.
- **Effective Oversight**: Observation frequency is on track to meet the monthly goal of 24 sessions.

### Priority Growth Areas
- **Assessment Uniformity**: There is some variance in "Assessment & Feedback" scores across departments that warrants investigation.
- **Goal Completion Velocity**: While goals are being set, the transition from "In Progress" to "Completed" could be accelerated through mid-point check-ins.

### Actionable Roadmap
1. **Targeted PD**: Focus next month's professional development on "Data-Driven Feedback" to address the assessment variance.
2. **Leader Calibration**: Schedule a brief calibration session for observers to ensure continued consistency in scoring.
3. **Strategic Recognition**: Publicly acknowledge teachers who have reached the "Certified" status for PD hours to maintain momentum.`;
}
