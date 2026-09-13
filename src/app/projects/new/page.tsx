import { redirect } from 'next/navigation';

import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { createProject } from '@/lib/project/store';

export default async function NewProjectPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const project = await createProject(toProjectScope(user));
  redirect(`/projects/${project.id}/basic`);
}
