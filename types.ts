
export enum PersonaId {
  JOY = 'JOY',         // 기쁨이 (사회자 역할)
  SADNESS = 'SADNESS', // 슬픔이
  ANGER = 'ANGER',     // 버럭이
  DISGUST = 'DISGUST', // 까칠이
  FEAR = 'FEAR',       // 소심이
}

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string; // Mapping to Lucide icon name conceptually
}

export interface Message {
  id: string;
  personaId: PersonaId;
  text: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  DEBATING = 'DEBATING',
  CONCLUDING = 'CONCLUDING',
  FINISHED = 'FINISHED',
}
