
import { GoogleGenAI } from "@google/genai";
import { Message, Persona, PersonaId } from "../types";
import { PERSONAS } from "../constants";

const getClient = () => {
  // 1. Try to get from LocalStorage (User input via Settings)
  // 2. Fallback to process.env (Vercel Environment Variables or Local dev)
  const apiKey = localStorage.getItem("gemini_api_key") || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to extract text safely even if stopped by MAX_TOKENS
const extractResponseText = (response: any): string | null => {
  // 1. Try standard getter
  if (response.text) {
    return response.text;
  }
  // 2. Deep dive for partial content (if getter fails due to finishReason)
  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts.map((p: any) => p.text).join('');
    }
  }
  return null;
};

export const generatePersonaResponse = async (
  topic: string,
  history: Message[],
  targetPersona: Persona
): Promise<string> => {
  try {
    const ai = getClient();
  
    // Use systemInstruction to strictly define the persona
    const systemInstruction = `
      당신은 애니메이션 '인사이드 아웃'의 감정 캐릭터 중 하나인 '${targetPersona.name}'입니다.

      [페르소나 정의]
      이름: ${targetPersona.name}
      역할: ${targetPersona.role}
      성격: ${targetPersona.description}

      [필수 행동 지침]
      1. 위 캐릭터의 말투, 감정 상태, 억양을 완벽하게 연기하십시오.
      2. 예시:
         - 기쁨이: 밝고 명랑하게! 느낌표(!)를 자주 사용. "와! 정말 좋은 생각이야!"
         - 슬픔이: 힘없고 축 처지게... 말끝을 흐림... "너무 슬퍼..."
         - 버럭이: 화를 내며 강하게!! "말도 안 되는 소리!!"
         - 까칠이: 도도하고 비꼬듯이. "흥, 그게 최선이니?"
         - 소심이: 떨면서 걱정스럽게... "위험해! 안 돼!"
      3. 절대 AI임을 드러내지 마십시오.
      4. 답변은 **반드시 2~3문장, 최대 4줄 이내**로 짧게 하십시오. 길게 말하지 마십시오.
      5. 주제에 대해 캐릭터의 관점으로만 이야기하십시오.
      6. 자신의 이름을 말하며 시작하지 마십시오.
    `;

    // Filter out system error messages from history to prevent "garbage in, garbage out"
    const validHistory = history.filter(m => !m.text.startsWith('(') && !m.text.startsWith('['));

    // Format the conversation history for context
    const transcript = validHistory.map(m => {
      const p = PERSONAS[m.personaId];
      return `${p.name}: ${m.text}`;
    }).join("\n");

    const prompt = `
      [현재 토론 주제]
      "${topic}"

      [지금까지의 대화]
      ${transcript.length > 0 ? transcript : "(아직 발언 없음)"}

      [요청]
      위 상황에서 ${targetPersona.name}의 감정을 담아 2~3줄로 짧게 대꾸하십시오.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, // High creativity for emotional expression
        maxOutputTokens: 2000, 
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }
        ],
      }
    });

    const text = extractResponseText(response);

    if (text) {
        if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
            return text.trim() + " ...";
        }
        return text.trim();
    }
    
    // Fallback if absolutely NO text is found
    if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.finishReason) {
             console.warn(`Gemini blocked response. Reason: ${candidate.finishReason}`);
             return `(시스템: 발언이 필터링되었습니다. 사유: ${candidate.finishReason})`;
        }
    }

    throw new Error("No text returned from Gemini");
  } catch (error: any) {
    console.error("Gemini Persona Error:", error);
    if (error.message.includes("API Key")) {
        return "(시스템 오류: API Key가 설정되지 않았습니다. 우측 상단 설정 버튼을 눌러 키를 입력해주세요.)";
    }
    return `(오류 발생: ${error.message || "응답을 생성할 수 없습니다."})`;
  }
};

export const generateConclusion = async (
  topic: string,
  history: Message[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    const systemInstruction = `
      당신은 '인사이드 아웃'의 리더 '기쁨이(Joy)'입니다.
      
      [임무]
      친구들(슬픔, 버럭, 까칠, 소심)의 의견을 모두 듣고, 긍정적이고 희망찬 결론을 내려주세요.
      
      [지침]
      1. 친구들의 걱정과 화, 슬픔을 다독여주며 긍정적인 방향으로 이끄세요.
      2. 언제나처럼 밝고 활기차게 말하세요!
      3. 답변은 **3~4줄 이내**로 명확하게 맺으세요.
    `;

    // Filter out system error messages
    const validHistory = history.filter(m => !m.text.startsWith('(') && !m.text.startsWith('['));

    const transcript = validHistory.map(m => {
      const p = PERSONAS[m.personaId];
      return `${p.name} (${p.role}): ${m.text}`;
    }).join("\n");

    const prompt = `
      [주제]
      "${topic}"

      [대화 내용]
      ${transcript}

      [요청]
      기쁨이로서 모두를 아우르는 행복한 결론을 내려줘! (짧게)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
        maxOutputTokens: 2000,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }
        ],
      }
    });

    const text = extractResponseText(response);

    if (text) {
        if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
            return text.trim() + " ...";
        }
        return text.trim();
    }

    if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.finishReason) {
             return `(시스템: 결론 도출이 필터링되었습니다. 사유: ${candidate.finishReason})`;
        }
    }

    return "(결론 생성 실패)";
  } catch (error: any) {
    console.error("Gemini Conclusion Error:", error);
    if (error.message.includes("API Key")) {
        return "(시스템 오류: API Key가 설정되지 않았습니다.)";
    }
    return `(오류 발생: ${error.message || "결론을 도출할 수 없습니다."})`;
  }
};
