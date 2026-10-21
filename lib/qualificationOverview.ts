export type QualificationRecord = {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
};

function firstText(record: QualificationRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

export function getExamOverview(record: QualificationRecord) {
  return {
    overview:
      firstText(record, [
        'overview',
        'target_audience',
        'target',
        'summary',
        'about',
        'description',
      ]) ||
      `${record.name}の概要・対象者情報はこれから整備します。公式サイトと合格体験談もあわせてご確認ください。`,
    difficulty:
      firstText(record, [
        'pass_rate',
        'passRate',
        'difficulty',
        'difficulty_level',
        'success_rate',
        'exam_difficulty',
      ]) || '合格率・難易度の目安は、データが集まり次第掲載します。公式の最新情報もご確認ください。',
    studyHours:
      firstText(record, [
        'study_hours',
        'typical_study_hours',
        'recommended_hours',
        'estimated_hours',
        'study_time',
      ]) || '一般的な目安勉強時間は資格や経験によって差があります。合格者の平均データも参考にしてください。',
    schedule:
      firstText(record, [
        'exam_schedule',
        'exam_frequency',
        'schedule',
        'frequency',
        'exam_date_info',
        'exam_dates',
      ]) || '試験日程・開催頻度は実施団体によって異なります。最新の公式スケジュールをご確認ください。',
  };
}
