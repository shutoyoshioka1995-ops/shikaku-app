export type StatsExperience = {
  daily_study_hours?: string;
  duration_days?: string;
  title?: string;
  current_status?: string;
  occupation?: string;
  study_method?: string;
  learning_style?: string;
  industry?: string;
  job_type?: string;
  roadmap?: Array<{
    period?: string;
    material?: string;
    textbook?: string;
    point?: string;
  }>;
};

export type QualificationStats = {
  count: number;
  avgHoursLabel: string;
  avgMonthsLabel: string;
  selfStudyRateLabel: string;
};

function trimDecimal(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function parseDailyHours(value?: string): number | null {
  if (!value || value === '未設定') return null;
  if (/30分〜1時間/.test(value)) return 0.75;
  if (/〜30分|30分程度/.test(value)) return 0.5;
  if (/6時間以上/.test(value)) return 6.5;

  const range = value.match(/(\d+(?:\.\d+)?)\s*[〜~－-]\s*(\d+(?:\.\d+)?)\s*時間/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;

  const hours = value.match(/(\d+(?:\.\d+)?)\s*時間/);
  if (hours) return Number(hours[1]);

  const minutes = value.match(/(\d+)\s*分/);
  if (minutes) return Number(minutes[1]) / 60;

  return null;
}

export function parseDurationMonths(value?: string): number | null {
  if (!value || value === '未設定') return null;
  if (/1週間/.test(value)) return 0.25;
  if (/2週間/.test(value)) return 0.5;
  if (/半年/.test(value)) return 6;
  if (/1年半|18ヶ?月/.test(value)) return 18;
  if (/3年以上/.test(value)) return 36;
  if (/1年程度/.test(value)) return 12;

  const yearRange = value.match(/(\d+)\s*年\s*[〜~－-]\s*(\d+)\s*年/);
  if (yearRange) return ((Number(yearRange[1]) + Number(yearRange[2])) / 2) * 12;

  const monthRange = value.match(/(\d+)\s*[〜~－-]\s*(\d+)\s*ヶ?月/);
  if (monthRange) return (Number(monthRange[1]) + Number(monthRange[2])) / 2;

  const months = value.match(/(\d+(?:\.\d+)?)\s*ヶ?月/);
  if (months) return Number(months[1]);

  const years = value.match(/(\d+(?:\.\d+)?)\s*年/);
  if (years) return Number(years[1]) * 12;

  const days = value.match(/約?(\d+)\s*日/);
  if (days) return Number(days[1]) / 30;

  return null;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function methodText(exp: StatsExperience) {
  const roadmapText = Array.isArray(exp.roadmap)
    ? exp.roadmap
        .map((step) => [step.period, step.material, step.textbook, step.point].filter(Boolean).join(' '))
        .join(' ')
    : '';

  return [
    exp.study_method,
    exp.learning_style,
    exp.current_status,
    exp.title,
    exp.occupation,
    exp.industry,
    exp.job_type,
    roadmapText,
  ]
    .filter(Boolean)
    .join(' ');
}

export function computeQualificationStats(experiences: StatsExperience[]): QualificationStats {
  const count = experiences.length;
  const avgHours = average(experiences.map((exp) => parseDailyHours(exp.daily_study_hours)).filter((v): v is number => v != null));
  const avgMonths = average(
    experiences.map((exp) => parseDurationMonths(exp.duration_days)).filter((v): v is number => v != null)
  );

  const selfStudyCount = experiences.filter((exp) => /独学/.test(methodText(exp))).length;
  const methodMentionCount = experiences.filter((exp) =>
    /独学|通信講座|通信教育|オンライン講座|通学|スクール|予備校/.test(methodText(exp))
  ).length;
  const rateBase = methodMentionCount > 0 ? methodMentionCount : count;
  const selfStudyRate = rateBase > 0 ? (selfStudyCount / rateBase) * 100 : null;

  return {
    count,
    avgHoursLabel: avgHours == null ? '—' : `${trimDecimal(avgHours)}時間`,
    avgMonthsLabel: avgMonths == null ? '—' : `${trimDecimal(avgMonths)}ヶ月`,
    selfStudyRateLabel: selfStudyRate == null ? '—' : `${Math.round(selfStudyRate)}%`,
  };
}
