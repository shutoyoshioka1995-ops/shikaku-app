export const AGE_GROUP_OPTIONS = ['10代', '20代', '30代', '40代', '50代〜'] as const;

export const INDUSTRY_OPTIONS = [
  '情報・通信業（IT・Web）',
  '製造業（メーカー）',
  '金融・保険業',
  '不動産業・建設業',
  '卸売・小売業',
  'サービス業',
  '運輸・物流業',
  '電気・ガス・水道業',
  '医療・福祉・介護',
  '教育・学習支援',
  '公務・団体職員',
  '学生（高校・専門・大学）',
  '主婦・主夫',
  'フリーランス・個人事業主',
  'その他',
] as const;

export const JOB_TYPE_OPTIONS = [
  'インサイドセールス系',
  '外勤営業・フィールドセールス系',
  '内勤営業・内勤コンサル系',
  '事務・管理部門系（総務・人事・経理など）',
  'マーケティング・企画・広報系',
  'エンジニア・IT技術職系',
  'クリエイター・デザイナー系',
  '専門職（士業・コンサルタントなど）',
  '接客・販売・店舗サービス系',
  '医療・福祉専門職系',
  '研究・開発・製造系',
  '学生・無職・その他',
] as const;

export const DEFAULT_AGE_GROUP = '20代';
export const DEFAULT_INDUSTRY = INDUSTRY_OPTIONS[0];
export const DEFAULT_JOB_TYPE = JOB_TYPE_OPTIONS[0];
