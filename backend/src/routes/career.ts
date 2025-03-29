import { Elysia } from "elysia";
import OpenAI from "openai";
import { config } from "dotenv";

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


type CareerResponse = {
  id: number;
  career: string;
  reason: string;
};

const careers = [
  { id: 1, title_th: "นักพัฒนาเกม", title_en: "Game Developer" },
  { id: 2, title_th: "เกมอาร์ตติส", title_en: "Game Artist" },
  { id: 3, title_th: "เกมแอนิเมเตอร์", title_en: "Game Animator" },
  { id: 4, title_th: "นักออกแบบเกม", title_en: "Game Designer" },
  { id: 5, title_th: "นักทดสอบระบบเกม", title_en: "Game Tester" },
  { id: 6, title_th: "นักพัฒนาเกม AR/VR", title_en: "AR/VR Game Developer" },
  { id: 7, title_th: "นักออกแบบเสียง", title_en: "Sound Designer" },
  { id: 8, title_th: "Technical Artist", title_en: "Technical Artist" },
  { id: 9, title_th: "นักกีฬา/นักพากย์เกม", title_en: "Gaming Commentator" },
  { id: 10, title_th: "สตรีมเมอร์", title_en: "Game Streamer" },
  { id: 11, title_th: "นักพากย์การแข่งขันเกม", title_en: "Esports Commentator" },
  { id: 12, title_th: "เกมแคสเตอร์", title_en: "Game Caster" },
  { id: 13, title_th: "นักกีฬาอีสปอร์ต", title_en: "Esports Athlete" },
  { id: 14, title_th: "ผู้ฝึกสอนกีฬาอีสปอร์ต", title_en: "Esports Coach" },
  { id: 15, title_th: "นักการตลาดและประชาสัมพันธ์เกม", title_en: "Game Marketing and PR Specialist" },
  { id: 16, title_th: "นักการตลาดด้านเกม", title_en: "Game Marketer" },
  { id: 17, title_th: "เกมมาสเตอร์", title_en: "Game Master" },
  { id: 18, title_th: "นักข่าววงการเกม", title_en: "Gaming Journalist" },
  { id: 19, title_th: "ผู้จัดการแข่งขันอีสปอร์ต", title_en: "Esports Event Manager" },
  { id: 20, title_th: "ทีมควบคุมการผลิตสื่อและถ่ายทอดสด", title_en: "Media Production and Live Streaming Specialist" }
];

export const careerRouter = new Elysia()
  .post("/recommend-career", async ({ body }) => {
    const { answers } = body as { answers: string[] };

    if (!answers || answers.length !== 8) {
      return { error: "กรุณาส่งคำตอบให้ครบทั้ง 8 ข้อ" };
    }

    const prompt = `
    ฉันมีคำตอบของผู้ใช้ที่ตอบคำถาม 8 ข้อเกี่ยวกับความสนใจในวงการเกม
    ให้คุณแนะนำอาชีพที่เหมาะสมที่สุดจากรายการนี้: 
    ${careers.map(c => c.title_th).join(", ")}

    คำตอบของผู้ใช้: ${JSON.stringify(answers)}

    วิเคราะห์และเลือกอาชีพที่เหมาะสมที่สุดให้ 1 ตัวเท่านั้น จากรายการข้างต้น พร้อมเหตุผลสั้นๆ ไม่เกิน 1 ประโยค
    คืนข้อมูลเป็น JSON format แบบนี้:
    {
      "id": "รหัสอาชีพ",
      "career": "ชื่ออาชีพภาษาไทย",
      "reason": "เหตุผลสั้นๆ"
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 200,
        response_format: { type: "json_object" }
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
      console.error("OpenAI Error:", error);
      return { error: "เกิดข้อผิดพลาดในการประมวลผล AI" };
    }
  });