import { Elysia } from "elysia";
import OpenAI from "openai";
import { config } from "dotenv";

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const careerRouter = new Elysia()
  .post("/recommend-career", async ({ body }) => {
    const { answers } = body as { answers: string[] };

    if (!answers || answers.length !== 8) {
      return { error: "กรุณาส่งคำตอบให้ครบทั้ง 8 ข้อ" };
    }

    const prompt = `
    ฉันมีคำตอบของผู้ใช้ที่ตอบคำถาม 8 ข้อเกี่ยวกับความสนใจในวงการเกม
    ให้คุณแนะนำอาชีพที่เหมาะสมที่สุดจากรายการนี้: 
    นักพัฒนาเกม, เกมอาร์ตติส, เกมแอนิเมเตอร์, นักออกแบบเกม, นักทดสอบระบบเกม, นักพัฒนาเกม AR/VR,
    นักออกแบบเสียง, Technical Artist, นักกีฬา/นักพากย์เกม, สตรีมเมอร์, นักพากย์การแข่งขันเกม, เกมแคสเตอร์,
    นักกีฬาอีสปอร์ต, ผู้ฝึกสอนกีฬาอีสปอร์ต, นักการตลาดและประชาสัมพันธ์เกม, นักการตลาดด้านเกม, เกมมาสเตอร์,
    นักข่าววงการเกม, ผู้จัดการแข่งขันอีสปอร์ต, ทีมควบคุมการผลิตสื่อและถ่ายทอดสด

    คำตอบของผู้ใช้: ${JSON.stringify(answers)}

    วิเคราะห์และเลือกอาชีพที่เหมาะสมที่สุดให้ 1-2 ตัว พร้อมเหตุผล.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 200,
      });

      return { career: response.choices[0]?.message?.content || "ไม่สามารถให้คำแนะนำได้" };
    } catch (error) {
      console.error("OpenAI Error:", error);
      return { error: "เกิดข้อผิดพลาดในการประมวลผล AI" };
    }
  });
