export type Module = "academic" | "general";
export type Skill = "listening" | "reading" | "writing" | "speaking";
export type QuestionType =
  | "multiple_choice"
  | "listening_fill"
  | "tfng"
  | "matching"
  | "short_answer";
export type Visibility = "public" | "private";
export type ThemeName = "light" | "dark" | "eye";
export type ViewMode = "paper" | "computer";

export interface AudioSection {
  section: number;
  start: number;
  title: string;
}

export interface Paper {
  id: string;
  title: string;
  module: Module;
  book: number;
  test: number;
  testType: ViewMode;
  pdfUrl: string;
  audioUrl?: string;
  thumbnailUrl: string;
  visibility: Visibility;
  source: string;
  version: number;
  skills: Skill[];
  pages: number;
  audioSections?: AudioSection[];
  blurb?: string;
  ownerId?: string;
}

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  paperId: string;
  skill: Skill;
  section: number;
  qnum: number;
  type: QuestionType;
  page: number;
  y: number;
  audioAnchor?: number;
  prompt: string;
  options?: string[];
  choices?: Choice[];
}

export interface GroupNote {
  skill: Skill;
  section: number;
  title: string;
  note: string;
}

export interface Passage {
  section: number;
  title: string;
  paragraphs: { label: string; text: string }[];
}

export interface PassageFile {
  groups: GroupNote[];
  passages: Passage[];
}

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface WritingTask {
  id: string;
  paperId: string;
  task: 1 | 2;
  module: Module;
  title: string;
  minWords: number;
  prompt: string;
  chart?: {
    caption: string;
    categories: string[];
    unit: string;
    series: ChartSeries[];
  };
  steps?: string[];
}

export interface SpeakingPrompt {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  prompt: string;
  points?: string[];
  followId?: string;
  questions?: string[];
}

export interface PaperProgress {
  answers: Record<string, string>;
  visited: string[];
  updatedAt: number;
}

export interface WordEntry {
  id: string;
  word: string;
  context: string;
  source: string;
  createdAt: number;
  ipa?: string;
  meaning?: string;
}

export interface Prefs {
  theme: ThemeName;
  scale: number;
}

export interface GradeResult {
  correct: boolean;
  answer: string;
  explanation: string;
}

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  passHash: string;
  member: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  member: boolean;
}

export interface PrivatePaperMeta {
  id: string;
  title: string;
  ownerId: string;
  createdAt: number;
  bytes: number;
}

declare global {
  interface Window {
    ieltsGlobal?: {
      docInfo: {
        paperId: string;
        title: string;
        module: Module;
        testType: ViewMode;
        sections: number;
      };
      price: {
        memberFee: number;
        speakingCorrection: number;
      };
    };
  }
}
