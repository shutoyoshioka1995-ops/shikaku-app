export type TemplateRoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  textbook_url?: string;
  point?: string;
  result?: string;
  score?: string;
};

export type ExperienceTemplate = {
  id: string;
  label: string;
  description: string;
  title: string;
  dailyStudyHours: string;
  durationDays: string;
  examAttempts?: string;
  currentStatus?: string;
  roadmapSteps: TemplateRoadmapStep[];
};

export const EXPERIENCE_TEMPLATES: ExperienceTemplate[] = [
  {
    id: 'intensive',
    label: '【短期間・独学】直前集中パターン',
    description: '短期間でインプットから過去問まで一気に仕上げる想定です。',
    title: '【短期間・独学】直前集中で合格したロードマップ',
    dailyStudyHours: '3〜4時間',
    durationDays: '1ヶ月（約30日）',
    examAttempts: '1回目（一発合格）',
    currentStatus: '初学者（知識ゼロ）',
    roadmapSteps: [
      {
        type: 'study',
        period: 'ステップ1：基礎インプット期（0〜10日目）',
        material: '公式テキスト／入門講座で範囲の全体像を把握',
        textbook_url: '',
        point: '出題範囲を一周し、頻出分野の用語と基本問題を押さえる。完璧を目指さず「分かる／分からない」を仕分ける。',
      },
      {
        type: 'study',
        period: 'ステップ2：過去問演習期（11〜24日目）',
        material: '直近3〜5年分の過去問',
        textbook_url: '',
        point: '時間を測って解き、間違えた問題は解説を読み直して翌日もう一度解く。弱点ノートを1冊にまとめる。',
      },
      {
        type: 'study',
        period: 'ステップ3：直前総仕上げ期（直近1週間）',
        material: '弱点ノート／模試・予想問題',
        textbook_url: '',
        point: '新しい教材は増やさず、間違えた問題と暗記事項だけを繰り返す。本番と同じ時間帯で1回は通し演習する。',
      },
    ],
  },
  {
    id: 'working',
    label: '【社会人】働きながらスキマ時間獲得パターン',
    description: '通勤・昼休み・夜の短時間学習を前提にした継続パターンです。',
    title: '【社会人】働きながらスキマ時間で合格したロードマップ',
    dailyStudyHours: '30分〜1時間程度',
    durationDays: '3ヶ月（約90日）',
    examAttempts: '1回目（一発合格）',
    currentStatus: '実務経験あり',
    roadmapSteps: [
      {
        type: 'study',
        period: 'ステップ1：基礎インプット期（通勤・スキマ時間）',
        material: '音声講義／スマホで読めるテキスト',
        textbook_url: '',
        point: '平日は通勤と昼休みで1単元だけ進める。夜は無理せず、できた日は復習1問でOKと決めて習慣化する。',
      },
      {
        type: 'study',
        period: 'ステップ2：過去問演習期（週末メイン）',
        material: '過去問集／問題アプリ',
        textbook_url: '',
        point: '土曜にまとめて解き、日曜に弱点だけ復習。平日は間違えた問題をアプリで5〜10問だけ回す。',
      },
      {
        type: 'study',
        period: 'ステップ3：直前期の総復習（試験2週間前〜）',
        material: '弱点ノート／直前対策問題',
        textbook_url: '',
        point: '新しい範囲に手を出さず、頻出論点とケアレスミス対策に絞る。本番の開始時刻に合わせて1回模擬試験を行う。',
      },
    ],
  },
  {
    id: 'revenge',
    label: '【不合格からの挽回】2回目リベンジ合格パターン',
    description: '1回目の失敗を分析し、弱点克服から再チャレンジする想定です。',
    title: '【不合格からの挽回】2回目でリベンジ合格したロードマップ',
    dailyStudyHours: '1〜2時間',
    durationDays: '2ヶ月（約60日）',
    examAttempts: '2回目',
    currentStatus: '再受験（独学経験あり）',
    roadmapSteps: [
      {
        type: 'study',
        period: 'ステップ1：不合格の振り返り・弱点整理期',
        material: '1回目の問題用紙メモ／自己採点結果',
        textbook_url: '',
        point: '落ちた原因を「知識不足／時間配分／ケアレスミス」に分解し、次に伸ばす分野を3つまでに絞る。',
      },
      {
        type: 'exam',
        period: '1回目受験',
        result: '不合格',
        score: '',
        point: '解けなかった大問と、本番で焦った時間帯をメモしておく。',
      },
      {
        type: 'study',
        period: 'ステップ2：基礎の再インプット期',
        material: '弱点分野のテキスト／解説動画',
        textbook_url: '',
        point: '得意分野は維持程度にし、失点源だった分野だけ教材を変えて理解し直す。',
      },
      {
        type: 'study',
        period: 'ステップ3：過去問演習期',
        material: '過去問（間違えた年度を優先）',
        textbook_url: '',
        point: '同じ問題を間隔を空けて3回解く。正解しても「なぜその選択肢が誤りか」を説明できるまで繰り返す。',
      },
    ],
  },
];
