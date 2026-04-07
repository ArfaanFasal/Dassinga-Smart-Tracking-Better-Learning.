import { AdminUserSection } from '../../components/admin/AdminUserSection';

export function AdminTeachers() {
  return (
    <AdminUserSection
      pageTitle="Teachers"
      pageSubtitle="Manage teacher accounts. Admin can add, edit, enable/disable, and delete teachers."
      roleFilter="teacher"
      createRole="teacher"
      createTitle="Add teacher"
      createButtonLabel="Create teacher"
    />
  );
}
