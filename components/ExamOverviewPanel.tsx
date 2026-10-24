import { getExamOverview, type QualificationRecord } from '@/lib/qualificationOverview';

export default function ExamOverviewPanel({ qualification }: { qualification: QualificationRecord }) {
  const overview = getExamOverview(qualification);
  const items = [
    { label: '概要・対象者', value: overview.overview },
    { label: '合格率・難易度目安', value: overview.difficulty },
    { label: '一般的な目安勉強時間', value: overview.studyHours },
    { label: '試験日程・開催頻度', value: overview.schedule },
  ];

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="border-b border-navy/10 pb-2 text-sm font-bold text-navy sm:text-base">
        試験概要・基本データ
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-bold text-navy/70">{item.label}</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
