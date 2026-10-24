import TextbookLinkCard from '@/components/TextbookLinkCard';

type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  textbook?: string;
  textbook_url?: string;
  point?: string;
  result?: string;
  score?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
};

export default function RoadmapTimeline({
  steps,
  qualificationName,
  passedDate,
  examAttempts,
}: {
  steps: RoadmapStep[];
  qualificationName?: string;
  passedDate?: string;
  examAttempts?: string;
}) {
  const hasSteps = Array.isArray(steps) && steps.length > 0;

  if (!hasSteps) {
    return <p className="text-sm text-gray-500">ロードマップの詳細ステップはありません。</p>;
  }

  return (
    <ol className="relative space-y-6 before:absolute before:top-4 before:bottom-8 before:left-4 before:w-0.5 before:bg-navy/20 before:content-['']">
      {steps.map((step, idx) => {
        const isExam = step.type === 'exam';
        const material = step.material || step.textbook;

        return (
          <li key={idx} className="relative pl-12">
            <div
              className={`absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-sm ring-4 ring-white ${
                isExam ? 'bg-navy-hover' : 'bg-navy'
              }`}
            >
              {idx + 1}
            </div>

            {!isExam && (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <div className="inline-block rounded bg-navy-soft px-2.5 py-1 text-sm font-bold text-navy">
                  期間: {step.period || '未設定'}
                </div>

                {(material || step.textbook_url) && (
                  <TextbookLinkCard
                    material={step.material}
                    textbook={step.textbook}
                    textbookUrl={step.textbook_url}
                  />
                )}

                {step.point && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-gray-500">学習のポイント・工夫</span>
                    <p className="whitespace-pre-wrap rounded-md border bg-white p-2.5 text-sm leading-relaxed text-gray-700">
                      {step.point}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isExam && (
              <div className="space-y-3 rounded-xl border-2 border-navy/20 bg-navy-soft/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 pb-2">
                  <span className="text-sm font-extrabold text-navy">
                    本番受験: {step.period || '時期未設定'}
                  </span>
                  <div className="flex items-center gap-2">
                    {step.score && (
                      <span className="rounded border border-navy/15 bg-white px-2 py-0.5 text-xs font-bold text-navy">
                        得点: {step.score}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        step.result === '合格' ? 'bg-navy text-white' : 'border border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {step.result || '結果未設定'}
                    </span>
                  </div>
                </div>

                {step.point && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-navy">
                      受験後の振り返り・次への反省点
                    </span>
                    <p className="whitespace-pre-wrap rounded-md border border-navy/10 bg-white p-2.5 text-sm leading-relaxed text-gray-800">
                      {step.point}
                    </p>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}

      <li className="relative pl-12 pt-1">
        <div className="absolute left-0 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[10px] font-extrabold text-white ring-4 ring-white">
          G
        </div>
        <div className="space-y-1 rounded-xl border-2 border-navy bg-white p-5">
          <span className="block text-xs font-bold tracking-wider text-navy uppercase">
            GOAL
          </span>
          <div className="text-lg font-extrabold text-navy sm:text-xl">
            {qualificationName || '資格'} 合格達成
          </div>
          {passedDate && <p className="text-xs font-medium text-gray-600">合格時期: {passedDate}</p>}
          {examAttempts && <p className="text-xs font-medium text-gray-600">受験回数: {examAttempts}</p>}
        </div>
      </li>
    </ol>
  );
}
