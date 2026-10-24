export function buildShareTweetUrl({
  qualificationName,
  durationDays,
  dailyStudyHours,
  pageUrl,
}: {
  qualificationName?: string;
  durationDays?: string;
  dailyStudyHours?: string;
  pageUrl: string;
}) {
  const name = qualificationName || '資格';
  const hashtag = name.replace(/[^\w\u3040-\u30ff\u4e00-\u9faf]/g, '');
  const text = [
    `【${name}】合格ロードマップを投稿しました。`,
    `学習期間: ${durationDays || '未設定'}`,
    `1日の勉強時間: ${dailyStudyHours || '未設定'}`,
    pageUrl,
    `#資格 #合格ロードマップ${hashtag ? ` #${hashtag}` : ''}`,
  ].join('\n');

  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
