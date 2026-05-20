import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function Home() {
  const surveys = await db.listSurveys();
  if (surveys.length > 0) redirect(`/survey/${surveys[0].id}`);
  return <p>No surveys found.</p>;
}
