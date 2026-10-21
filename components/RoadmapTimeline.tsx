type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  point?: string;
  result?: string;
  score?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

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
    <ol className="relative space-y-6 before:absolute before:top-4 before:bottom-8 before:left-4 before:w-0.5 before:bg-blue-200 before:content-['']">
      {steps.map((step, idx) => {
        const isExam = step.type === 'exam';
        const youtubeId = step.material ? extractYouTubeId(step.material) : null;

        return (
          <li key={idx} className="relative pl-12">
            <div
              className={`absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-sm ring-4 ring-white ${
                isExam ? 'bg-amber-500' : 'bg-blue-600'
              }`}
            >
              {idx + 1}
            </div>

            {!isExam && (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <div className="inline-block rounded bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                  ⏱️ 期間: {step.period || '未設定'}
                </div>

                {step.material && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-gray-500">📚 使用した教材・動画</span>
                    {youtubeId ? (
                      <div className="mt-1 space-y-2">
                        <p className="break-all rounded border bg-white p-2 text-xs text-gray-500">
                          🔗{' '}
                          <a
                            href={step.material}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {step.material}
                          </a>
                        </p>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black shadow-sm">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video player"
                            className="absolute top-0 left-0 h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap rounded-md border bg-white p-2.5 text-sm font-medium text-gray-800">
                        {step.material}
                      </p>
                    )}
                  </div>
                )}

                {step.point && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-gray-500">💡 学習のポイント・工夫</span>
                    <p className="whitespace-pre-wrap rounded-md border bg-white p-2.5 text-sm leading-relaxed text-gray-700">
                      {step.point}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isExam && (
              <div className="space-y-3 rounded-xl border-2 border-amber-300 bg-amber-50/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                  <span className="text-sm font-extrabold text-amber-900">
                    📝 本番受験: {step.period || '時期未設定'}
                  </span>
                  <div className="flex items-center gap-2">
                    {step.score && (
                      <span className="rounded border border-amber-200 bg-white px-2 py-0.5 text-xs font-bold text-amber-900">
                        得点: {step.score}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        step.result === '合格' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {step.result || '結果未設定'}
                    </span>
                  </div>
                </div>

                {step.point && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-amber-800">
                      🔍 受験後の振り返り・次への反省点
                    </span>
                    <p className="whitespace-pre-wrap rounded-md border border-amber-200 bg-white p-2.5 text-sm leading-relaxed text-gray-800">
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
        <div className="absolute left-0 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm shadow ring-4 ring-white">
          🏆
        </div>
        <div className="space-y-1 rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 p-5 shadow-sm">
          <span className="block text-xs font-bold tracking-wider text-yellow-800 uppercase">
            GOAL
          </span>
          <div className="text-lg font-extrabold text-amber-900 sm:text-xl">
            🏆 {qualificationName || '資格'} 合格達成！
          </div>
          {passedDate && <p className="text-xs font-medium text-amber-700">合格時期: {passedDate}</p>}
          {examAttempts && <p className="text-xs font-medium text-amber-700">受験回数: {examAttempts}</p>}
        </div>
      </li>
    </ol>
  );
}
