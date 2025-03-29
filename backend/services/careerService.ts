
// services/careerService.ts
import OpenAI from "openai";
import { config } from "dotenv";

config();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type CareerResponse = {
    id: number;
    career: string;
    reason: string;
};

export const CareerService = {
    /**
     * Gets career recommendations based on user answers
     * @param answers Array of question answers (questionId and answer boolean)
     * @param questions Optional array of all questions for reference
     * @returns Career recommendation object
     */
    async getCareerRecommendation(

        userAnswers: { question: string; answer: boolean }[],
        careerOptions: {
            id: number;
            job_title_th: string;
            job_title_en: string;
            short_desc: string;
            job_avatar: string;
            academy_link: string;
        }[]
    ) {
        try {


            const prompt = `
      ฉันมีคำตอบของผู้ใช้ที่ตอบคำถามเกี่ยวกับความสนใจในวงการเกม
      ให้คุณแนะนำอาชีพที่เหมาะสมที่สุดจากรายการนี้: 
      ${JSON.stringify(careerOptions)}

      คำตอบของผู้ใช้: ${JSON.stringify(userAnswers)}

      วิเคราะห์และเลือกอาชีพที่เหมาะสมที่สุดให้ 1 ตัวเท่านั้น จากรายการข้างต้น พร้อมเหตุผลสั้นๆ ไม่เกิน 1 ประโยค
    คืนข้อมูลเป็น JSON format แบบนี้:
    {
      "id": "รหัสอาชีพ",
      "career": "ชื่ออาชีพภาษาไทย",
      "reason": "เหตุผลสั้นๆ"
    }
      `;

            // Call OpenAI API
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "system", content: prompt }],
                max_tokens: 200,
            });

            const content = response.choices[0]?.message?.content || null;

            if (!content) {
                return { error: "ไม่สามารถให้คำแนะนำได้" };
            }
            try {
                const parsedResult: CareerResponse = JSON.parse(content);

                return parsedResult

            } catch (parseError) {
                console.error("JSON Parse Error:", parseError, "Response:", content);
                return {
                    error: "ไม่สามารถประมวลผลข้อมูลจาก AI ได้",
                    raw_response: content
                };
            }

        } catch (error) {
            console.error("Career Service Error:", error);
            return {
                error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล AI",
                success: false
            };
        }
    }
};