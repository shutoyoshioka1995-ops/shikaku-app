import { computeQualificationStats, type StatsExperience } from '@/lib/qualificationStats';

export default function QualificationStatsCards({ experiences }: { experiences: StatsExperience[] }) {
  if (!experiences.length) {
    return (
      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-5 py-6 text-center shadow-sm">
        <p className="text-sm font-bold text-blue-800">📊 合格者データ統計</p>
        <p className="mt-1 text-sm text-blue-700">データが集まると統計が表示されます</p>
      </div>
    );
  }

  const stats = computeQualificationStats(experiences);
  const cards = [
    { emoji: '📊', label: '平均1日の学習時間', value: stats.avgHoursLabel, accent: 'text-blue-700' },
    { emoji: '⏳', label: '平均学習期間', value: stats.avgMonthsLabel, accent: 'text-amber-700' },
    { emoji: '📖', label: '独学率', value: stats.selfStudyRateLabel, accent: 'text-emerald-700' },
    { emoji: '👥', label: '投稿数', value: `${stats.count}件`, accent: 'text-gray-900' },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-gray-800">📊 合格者データ統計</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm"
          >
            <p className="text-lg leading-none">{card.emoji}</p>
            <p className={`mt-2 text-xl font-extrabold tracking-tight sm:text-2xl ${card.accent}`}>
              {card.value}
            </p>
            <p className="mt-1 text-[11px] font-bold text-gray-500 sm:text-xs">{card.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
