import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

export function StudentProfile() {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    photoDataUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || user?.name || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || '',
      course: profile.course || '',
      photoDataUrl: profile.photoDataUrl || '',
    });
  }, [profile, user]);

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-dassinga-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your information is saved on this device (swap `profileApi` for MongoDB in production).
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80"
      >
        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            Profile updated.
          </div>
        )}

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
            {form.photoDataUrl ? (
              <img src={form.photoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-slate-400">
                {form.name?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Profile photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onPhoto}
              className="mt-1 block text-sm text-slate-600 file:mr-2 file:rounded-lg file:bg-dassinga-navy/10 file:px-3 file:py-1.5 file:text-dassinga-navy"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="+1 …"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Course / Department
          </label>
          <input
            value={form.course}
            onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Computer Science"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-dassinga-navy py-3 text-sm font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-60 dark:bg-dassinga-blue"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
