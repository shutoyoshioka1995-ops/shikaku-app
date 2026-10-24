import { supabase } from '@/lib/supabase';
import HomeBrowse from '@/components/HomeBrowse';
import { mergeQualifications } from '@/lib/qualificationMerge';

export const revalidate = 0;

export default async function HomePage() {
  // 資格一覧
  const { data: qualData } = await supabase
    .from('qualifications')
    .select('*')
    .order('name', { ascending: true });

  const rawQualifications = (qualData || []) as { id: string; name: string }[];
  const qualifications = mergeQualifications(rawQualifications);
  const qualMap = new Map<string, string>();
  qualifications.forEach((group) => {
    group.aliasIds.forEach((id: string) => qualMap.set(id, group.name));
  });

  // 体験談
  const { data: expData } = await supabase
    .from('experiences')
    .select('*')
    .order('created_at', { ascending: false });

  const formattedExps = (expData || []).map((exp: any) => ({
    ...exp,
    qualification_name: qualMap.get(exp.qualification_id) || '資格',
  }));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-10">
        <HomeBrowse
          qualifications={qualifications.map((qual) => ({
            id: qual.id,
            name: qual.name,
            aliasIds: qual.aliasIds ?? [],
            aliasNames: qual.aliasNames ?? [],
          }))}
          experiences={formattedExps}
        />
      </div>
    </main>
  );
}
