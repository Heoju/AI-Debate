import { GoogleGenAI } from "@google/genai";
import { Message, Persona, PersonaId } from "../types";
import { PERSONAS } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePersonaResponse = async (
  topic: string,
  history: Message[],
  targetPersona: Persona
): Promise<string> => {
  const ai = getClient();
  
  // Construct a transcript string for the model
  const transcript = history.map(m => {
    const p = PERSONAS[m.personaId];
    return `${p.name} (${p.role}): ${m.text}`;
  }).join("\n");

  const prompt = `
    당신은 토론 위원회의 일원으로서 역할극을 하고 있습니다.
    
    주제: "${topic}"

    당신의 역할(Persona):
    이름: ${targetPersona.name}
    역할: ${targetPersona.role}
    성격/설명: ${targetPersona.description}

    현재까지의 토론 내용:
    ${transcript}

    지시사항:
    1. 토론 내용과 주제를 읽으십시오.
    2. 반드시 ${targetPersona.name}의 성격과 역할에 완전히 몰입하여 답변하십시오.
    3. 답변은 한국어로 작성하십시오.
    4. 간결하게 말하십시오 (80단어 이내).
    5. 당신의 역할에 맞는 독창적인 통찰력을 제공하십시오.
    6. 답변 앞에 당신의 이름을 붙이지 마십시오. 바로 내용만 말하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8, // Slightly creative for better roleplay
        maxOutputTokens: 250, // Increased slightly for Korean characters
      }
    });

    return response.text || "(응답 없음)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "기술적인 문제로 인해 의견을 말씀드릴 수 없습니다.";
  }
};

export const generateConclusion = async (
  topic: string,
  history: Message[]
): Promise<string> => {
  const ai = getClient();
  const transcript = history.map(m => {
    const p = PERSONAS[m.personaId];
    return `${p.name} (${p.role}): ${m.text}`;
  }).join("\n");

  const prompt = `
    당신은 이 토론 위원회의 '의장(Moderator)'입니다.
    
    주제: "${topic}"

    전체 토론 내용:
    ${transcript}

    지시사항:
    1. 위원들의 주장을 종합하십시오.
    2. 주제에 대한 균형 잡힌 최종 결론이나 판결을 내리십시오.
    3. 서로 다른 입장의 타당한 점들을 인정하십시오.
    4. 어조는 권위 있으면서도 공정해야 합니다.
    5. 한국어로 작성하십시오.
    6. 150단어 이내로 요약하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    return response.text || "(결론 생성 실패)";
  } catch (error) {
    console.error("Gemini Conclusion Error:", error);
    return "위원회가 휴회했으나, 최종 기록을 생성할 수 없습니다.";
  }
};