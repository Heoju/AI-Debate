
import { Persona, PersonaId } from './types';
// Icons are referenced by string name in CouncilMember.tsx, so we don't strict import here to avoid circular dep issues in some bundlers, 
// but logically they map to Lucide icons.

export const PERSONAS: Record<PersonaId, Persona> = {
  [PersonaId.JOY]: {
    id: PersonaId.JOY,
    name: "기쁨이",
    role: "행복의 리더",
    description: "긍정적인 면을 보고 모두를 이끌어 줍니다. 언제나 활기차고 희망찬 결론을 내리려 노력합니다.",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-500/50",
    iconName: "Sun"
  },
  [PersonaId.SADNESS]: {
    id: PersonaId.SADNESS,
    name: "슬픔이",
    role: "공감하는 우울함",
    description: "상황의 어두운 면과 슬픈 점을 짚어냅니다. 무기력하지만 깊은 공감 능력을 가지고 문제를 바라봅니다.",
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-500/50",
    iconName: "CloudRain"
  },
  [PersonaId.ANGER]: {
    id: PersonaId.ANGER,
    name: "버럭이",
    role: "불 같은 정의",
    description: "불공정하거나 답답한 상황에 대해 강하게 화를 냅니다. 직설적이고 폭발적으로 의견을 표출합니다.",
    color: "text-red-500",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-500/50",
    iconName: "Flame"
  },
  [PersonaId.DISGUST]: {
    id: PersonaId.DISGUST,
    name: "까칠이",
    role: "깐깐한 비평가",
    description: "수준 떨어지거나 맘에 안 드는 것을 못 참습니다. 냉소적이고 비꼬는 말투로 핵심을 꼬집습니다.",
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    borderColor: "border-green-500/50",
    iconName: "OctagonX"
  },
  [PersonaId.FEAR]: {
    id: PersonaId.FEAR,
    name: "소심이",
    role: "안전 지킴이",
    description: "모든 상황에서 위험과 최악의 시나리오를 상상합니다. 안절부절못하며 조심스러운 접근을 주장합니다.",
    color: "text-purple-400",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-500/50",
    iconName: "Eye"
  }
};

export const MAX_TURNS = 10; // Auto-conclude after this many turns if not stopped
