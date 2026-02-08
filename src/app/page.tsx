import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientHome from './ClientHome';

export default async function Home() {
  const cookieStore = await cookies();
  const group = cookieStore.get('treasure-group');
  const username = cookieStore.get('treasure-username');

  // Auto-redirect if already logged in
  if (group && username) {
    redirect('/dashboard');
  }

  return <ClientHome />;
}


