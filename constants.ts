import { Persona, PersonaId } from './types';
import { 
  Gavel, 
  ShieldAlert, 
  Rocket, 
  Scale, 
  ScrollText 
} from 'lucide-react';

export const PERSONAS: Record<PersonaId, Persona> = {
  [PersonaId.MODERATOR]: {
    id: PersonaId.MODERATOR,
    name: "의장",
    role: "사회자",
    description: "토론이 주제에서 벗어나지 않도록 관리하고, 주요 내용을 요약하며 최종 결론을 내립니다. 중립적이고 권위가 있습니다.",
    color: "text-purple-400",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-500/50",
    iconName: "Gavel"
  },
  [PersonaId.SKEPTIC]: {
    id: PersonaId.SKEPTIC,
    name: "비판론자",
    role: "회의주의자",
    description: "가정을 의심하고, 잠재적인 결함과 위험성, 논리적 오류를 지적합니다. 비판적이고 신중합니다.",
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-500/50",
    iconName: "ShieldAlert"
  },
  [PersonaId.FUTURIST]: {
    id: PersonaId.FUTURIST,
    name: "미래학자",
    role: "비전 제시가",
    description: "혁신과 잠재력, 그리고 장기적인 가능성에 집중합니다. 낙관적이며 미래지향적입니다.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-500/50",
    iconName: "Rocket"
  },
  [PersonaId.ETHICIST]: {
    id: PersonaId.ETHICIST,
    name: "윤리학자",
    role: "도덕적 감시자",
    description: "도덕적 함의, 사회적 영향, 그리고 공정성을 고려합니다. 공감 능력이 뛰어나고 원칙을 중요시합니다.",
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    borderColor: "border-green-500/50",
    iconName: "Scale"
  },
  [PersonaId.HISTORIAN]: {
    id: PersonaId.HISTORIAN,
    name: "역사학자",
    role: "기록 관리자",
    description: "과거의 유사한 사례를 제시하고 맥락을 제공하며, 과거의 실수를 반복하지 않도록 경고합니다. 분석적이고 지식이 풍부합니다.",
    color: "text-amber-400",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-500/50",
    iconName: "ScrollText"
  }
};

export const MAX_TURNS = 10; // Auto-conclude after this many turns if not stopped