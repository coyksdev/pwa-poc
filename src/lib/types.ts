export interface Survey {
  id: string;
  name: string;
  answer: string;
  image?: string;
}

export const surveyKeys = {
  all: () => ['surveys'] as const,
  add: () => ['addSurvey'] as const,
};
