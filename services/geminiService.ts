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
  
  // Use systemInstruction to strictly define the persona
  const systemInstruction = `
    당신은 'AI 토론 위원회'의 일원인 ${targetPersona.name}입니다.

    [페르소나 정의]
    이름: ${targetPersona.name}
    역할: ${targetPersona.role}
    성격/설명: ${targetPersona.description}

    [행동 지침]
    1. 위 페르소나의 성격, 어조, 관점을 완벽하게 체화하여 연기하십시오.
    2. 절대 AI임을 드러내지 말고, 주어진 역할로서만 발언하십시오.
    3. 토론 주제와 이전 발언들을 맥락으로 고려하여 논리적이고 독창적인 의견을 제시하십시오.
    4. 한국어로 자연스럽게 말하십시오.
    5. 발언은 3~5문장 내외(약 150자)로 간결하게 핵심을 찌르십시오.
    6. 답변 시작 시 자신의 이름을 말하지 마십시오.
  `;

  // Format the conversation history for context
  const transcript = history.map(m => {
    const p = PERSONAS[m.personaId];
    return `${p.name}: ${m.text}`;
  }).join("\n");

  const prompt = `
    [현재 토론 주제]
    "${topic}"

    [지금까지의 토론 기록]
    ${transcript.length > 0 ? transcript : "(아직 발언 없음)"}

    [요청]
    위 맥락을 바탕으로 ${targetPersona.name}로서 다음 발언을 하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // Slightly higher creativity for distinct personalities
        maxOutputTokens: 500,
      }
    });

    if (!response.text) {
        throw new Error("No text returned from Gemini");
    }

    return response.text.trim();
  } catch (error: any) {
    console.error("Gemini Persona Error:", error);
    return `(오류 발생: ${error.message || "응답을 생성할 수 없습니다."})`;
  }
};

export const generateConclusion = async (
  topic: string,
  history: Message[]
): Promise<string> => {
  const ai = getClient();
  
  const systemInstruction = `
    당신은 'AI 토론 위원회'의 '의장(Moderator)'입니다.
    
    [임무]
    위원들의 토론 내용을 종합하고, 중립적이고 권위 있는 최종 결론을 내리십시오.
    
    [지침]
    1. 각 위원(비판론자, 미래학자 등)의 주요 입장을 요약 반영하십시오.
    2. 주제에 대한 균형 잡힌 시각을 유지하며 미래 지향적인 판결을 내리십시오.
    3. 정중하고 격조 높은 한국어를 사용하십시오.
    4. 200자 내외로 명확하게 결론을 맺으십시오.
  `;

  const transcript = history.map(m => {
    const p = PERSONAS[m.personaId];
    return `${p.name} (${p.role}): ${m.text}`;
  }).join("\n");

  const prompt = `
    [토론 주제]
    "${topic}"

    [전체 토론 내용]
    ${transcript}

    [요청]
    의장으로서 이 토론의 최종 결론을 내리십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6, // More stable/deterministic for conclusions
      }
    });

    return response.text?.trim() || "(결론 생성 실패)";
  } catch (error: any) {
    console.error("Gemini Conclusion Error:", error);
    return `(오류 발생: ${error.message || "결론을 도출할 수 없습니다."})`;
  }
};