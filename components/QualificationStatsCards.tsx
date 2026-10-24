import { computeQualificationStats, type StatsExperience } from '@/lib/qualificationStats';

export default function QualificationStatsCards({ experiences }: { experiences: StatsExperience[] }) {
  if (!experiences.length) {
    return (
      <div className="rounded-xl border border-dashed border-navy/20 bg-navy-soft px-5 py-6 text-center">
        <p className="text-sm font-bold text-navy">合格者データ統計</p>
        <p className="mt-1 text-sm text-navy/80">データが集まると統計が表示されます</p>
      </div>
    );
  }

  const stats = computeQualificationStats(experiences);
  const cards = [
    { label: '平均1日の学習時間', value: stats.avgHoursLabel },
    { label: '平均学習期間', value: stats.avgMonthsLabel },
    { label: '独学率', value: stats.selfStudyRateLabel },
    { label: '投稿数', value: `${stats.count}件` },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-navy">合格者データ統計</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-center"
          >
            <p className="mt-1 text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
              {card.value}
            </p>
            <p className="mt-1 text-[11px] font-bold text-gray-500 sm:text-xs">{card.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
