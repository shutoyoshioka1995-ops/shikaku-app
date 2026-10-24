export const PERSONA_FILTERS = [
  { id: 'working', label: '社会人' },
  { id: 'student', label: '学生' },
  { id: 'homemaker', label: '主婦・主夫' },
] as const;

export const METHOD_FILTERS = [
  { id: 'self', label: '独学' },
  { id: 'online', label: '通信講座' },
  { id: 'school', label: '通学スクール' },
] as const;

export const ALL_FILTERS = [...PERSONA_FILTERS, ...METHOD_FILTERS];

export type FilterId = (typeof ALL_FILTERS)[number]['id'];

type FilterableExperience = {
  industry?: string;
  job_type?: string;
  occupation?: string;
  current_status?: string;
  title?: string;
  study_method?: string;
  learning_style?: string;
  roadmap?: Array<{
    period?: string;
    material?: string;
    textbook?: string;
    point?: string;
  }>;
};

function experienceText(exp: FilterableExperience) {
  const roadmapText = Array.isArray(exp.roadmap)
    ? exp.roadmap
        .map((step) => [step.period, step.material, step.textbook, step.point].filter(Boolean).join(' '))
        .join(' ')
    : '';

  return [
    exp.industry,
    exp.job_type,
    exp.occupation,
    exp.current_status,
    exp.title,
    exp.study_method,
    exp.learning_style,
    roadmapText,
  ]
    .filter(Boolean)
    .join(' ');
}

export function personaLabel(exp: FilterableExperience): FilterId | null {
  const style = exp.learning_style || '';
  if (style === '主婦・主夫' || style === 'homemaker') return 'homemaker';
  if (style === '学生' || style === 'student') return 'student';
  if (style === '社会人' || style === 'working') return 'working';

  const source = `${exp.industry || ''} ${exp.job_type || ''} ${exp.occupation || ''} ${style}`;
  if (/主婦|主夫/.test(source)) return 'homemaker';
  if (/学生/.test(source)) return 'student';
  if (/社会人/.test(source)) return 'working';
  return null;
}

export function matchesMethod(exp: FilterableExperience, id: FilterId) {
  const method = exp.study_method || '';
  if (id === 'self' && (method === '独学' || method === 'self')) return true;
  if (id === 'online' && (method === '通信講座' || method === 'online')) return true;
  if (id === 'school' && (method === '通学スクール' || method === 'school')) return true;

  const text = `${method} ${experienceText(exp)}`;
  if (id === 'self') return /独学/.test(text);
  if (id === 'online') return /通信講座|通信教育|通信|オンライン講座/.test(text);
  if (id === 'school') return /通学|スクール|予備校/.test(text);
  return false;
}

export function matchesFilters(exp: FilterableExperience, selected: FilterId[]) {
  if (selected.length === 0) return true;

  const selectedPersonas = selected.filter((id) =>
    PERSONA_FILTERS.some((filter) => filter.id === id)
  );
  const selectedMethods = selected.filter((id) =>
    METHOD_FILTERS.some((filter) => filter.id === id)
  );

  if (selectedPersonas.length > 0) {
    const label = personaLabel(exp);
    if (!label || !selectedPersonas.includes(label)) return false;
  }

  if (selectedMethods.length > 0 && !selectedMethods.some((id) => matchesMethod(exp, id))) {
    return false;
  }

  return true;
}

export function personaLabelText(id: string) {
  return PERSONA_FILTERS.find((item) => item.id === id)?.label || id;
}

export function methodLabelText(id: string) {
  return METHOD_FILTERS.find((item) => item.id === id)?.label || id;
}
