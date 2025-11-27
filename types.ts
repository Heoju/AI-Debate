export enum PersonaId {
  MODERATOR = 'MODERATOR',
  SKEPTIC = 'SKEPTIC',
  FUTURIST = 'FUTURIST',
  ETHICIST = 'ETHICIST',
  HISTORIAN = 'HISTORIAN',
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
