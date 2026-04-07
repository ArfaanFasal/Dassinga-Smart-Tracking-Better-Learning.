import { useMemo, useState } from 'react';
import { useLMS } from '../../context/LMSContext';

export function AdminUserSection({
  pageTitle,
  pageSubtitle,
  roleFilter,
  createRole,
  createTitle,
  createButtonLabel,
}) {
  const { adminData, refresh, createUserByAdmin, updateUserByAdmin, deleteUserByAdmin, toggleUserStatusByAdmin } =
    useLMS();

  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '', role: roleFilter, enabled: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const users = adminData?.users || [];

  const filteredUsers = useMemo(
    () => users.filter((u) => String(u.role || '').toLowerCase() === roleFilter),
    [users, roleFilter]
  );

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || roleFilter,
      enabled: Boolean(user.enabled),
    });
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createUserByAdmin({
        ...createForm,
        role: createRole,
      });
      setCreateForm({ name: '', email: '', password: '' });
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not create user');
    } finally {
      setSaving(false);
    }
  };

  const onSaveEdit = async (userId) => {
    setError('');
    setSaving(true);
    try {
      await updateUserByAdmin(userId, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        enabled: editForm.enabled,
      });
      setEditingId('');
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pageSubtitle}</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{createTitle}</h2>
        <form onSubmit={onCreate} autoComplete="off" className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            required
            name={`${roleFilter}_name_no_autofill`}
            autoComplete="off"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            required
            type="email"
            name={`${roleFilter}_email_no_autofill`}
            autoComplete="off"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            required
            type="password"
            name={`${roleFilter}_password_no_autofill`}
            autoComplete="new-password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password (min 8)"
            className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : createButtonLabel}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          {roleFilter === 'teacher' ? 'Teachers' : 'Users'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">Total: {filteredUsers.length}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Enabled</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2">
                    {editingId === u.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
                      />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="py-2">
                    {editingId === u.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td className="py-2">
                    {editingId === u.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="py-2">{u.enabled ? 'Yes' : 'No'}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {editingId === u.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onSaveEdit(u.id)}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId('')}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setSaving(true);
                              setError('');
                              try {
                                await toggleUserStatusByAdmin(u.id, !u.enabled);
                                await refresh();
                              } catch (err) {
                                setError(err.message || 'Could not change status');
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          >
                            {u.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setSaving(true);
                              setError('');
                              try {
                                await deleteUserByAdmin(u.id);
                                await refresh();
                              } catch (err) {
                                setError(err.message || 'Could not delete user');
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
