import { AdminUserSection } from '../../components/admin/AdminUserSection';

export function AdminUsers() {
  return (
    <AdminUserSection
      pageTitle="Users"
      pageSubtitle="Manage student accounts. Admin can add, edit, enable/disable, and delete users."
      roleFilter="student"
      createRole="student"
      createTitle="Add student"
      createButtonLabel="Create student"
    />
  );
}
