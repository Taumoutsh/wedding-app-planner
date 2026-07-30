import { useEffect, useMemo, useState } from 'react';
import type { WeddingDTO, AdminUserDTO } from '@wedding-planner/shared';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { ConfirmDialog } from './ConfirmDialog';

type PendingDelete =
  | { type: 'wedding'; id: number; name: string }
  | { type: 'user'; id: number; name: string };

export const AdminPage = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [weddings, setWeddings] = useState<WeddingDTO[]>([]);
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newWeddingName, setNewWeddingName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserWeddingId, setNewUserWeddingId] = useState<number | ''>('');

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [reveal, setReveal] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const load = async () => {
    try {
      const [w, u] = await Promise.all([adminApi.listWeddings(), adminApi.listUsers()]);
      setWeddings(w.data);
      setUsers(u.data);
      if (newUserWeddingId === '' && w.data.length > 0) setNewUserWeddingId(w.data[0].id);
    } catch (e) {
      setError(t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weddingName = useMemo(() => {
    const map = new Map(weddings.map((w) => [w.id, w.name]));
    return (id: number | null) => (id == null ? '—' : map.get(id) ?? '—');
  }, [weddings]);

  // The wedding picker also filters the accounts list to that wedding.
  const visibleUsers = useMemo(
    () => (newUserWeddingId === '' ? users : users.filter((u) => u.weddingId === newUserWeddingId)),
    [users, newUserWeddingId]
  );

  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e?.response?.data?.message || t('admin.actionFailed'));
    }
  };

  const handleCreateWedding = () =>
    run(async () => {
      if (!newWeddingName.trim()) return;
      await adminApi.createWedding(newWeddingName.trim());
      setNewWeddingName('');
      await load();
    });

  const handleRename = (id: number) =>
    run(async () => {
      if (!renameValue.trim()) return;
      await adminApi.renameWedding(id, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
      await load();
    });

  const handleCreateUser = () =>
    run(async () => {
      if (!newUserName.trim() || newUserWeddingId === '') return;
      const res = await adminApi.createUser(newUserName.trim(), Number(newUserWeddingId));
      setNewUserName('');
      setReveal({ username: res.data.user.username, password: res.data.password });
      setCopied(false);
      await load();
    });

  const handleResetPassword = (u: AdminUserDTO) =>
    run(async () => {
      const res = await adminApi.resetPassword(u.id);
      setReveal({ username: res.data.user.username, password: res.data.password });
      setCopied(false);
    });

  const handleToggleAdmin = (u: AdminUserDTO) =>
    run(async () => {
      await adminApi.setUserAdmin(u.id, !u.isAdmin);
      await load();
    });

  const confirmDelete = () =>
    run(async () => {
      if (!pendingDelete) return;
      if (pendingDelete.type === 'wedding') await adminApi.deleteWedding(pendingDelete.id);
      else await adminApi.deleteUser(pendingDelete.id);
      setPendingDelete(null);
      await load();
    });

  const copyPassword = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.password);
      setCopied(true);
    } catch {
      /* clipboard may be unavailable; the password is visible to copy manually */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-br from-[#D97B8A] to-[#E8B4A1] shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.back')}
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('admin.title')}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-600">{t('admin.loading')}</div>
        ) : (
          <>
            {/* Weddings */}
            <section className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#D97B8A] to-[#E8B4A1] px-4 py-3">
                <h2 className="text-lg font-bold text-white">{t('admin.weddings')}</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newWeddingName}
                    onChange={(e) => setNewWeddingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWedding()}
                    placeholder={t('admin.weddingNamePlaceholder')}
                    className="flex-1 h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    onClick={handleCreateWedding}
                    className="h-12 px-4 bg-[#D97B8A] text-white rounded-md text-sm font-medium hover:opacity-90 transition"
                  >
                    {t('admin.create')}
                  </button>
                </div>

                <ul className="divide-y divide-gray-100">
                  {weddings.map((w) => {
                    const isCurrent = user?.weddingId === w.id;
                    return (
                      <li key={w.id} className="py-3 flex items-center gap-2 sm:gap-3">
                        <div className="min-w-0 flex-1">
                          {renamingId === w.id ? (
                            <div className="flex gap-2">
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename(w.id)}
                                autoFocus
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                style={{ fontSize: '16px' }}
                              />
                              <button onClick={() => handleRename(w.id)} className="text-sm text-[#D97B8A] font-medium">
                                {t('admin.save')}
                              </button>
                              <button onClick={() => setRenamingId(null)} className="text-sm text-gray-500">
                                {t('admin.cancel')}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">{w.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] uppercase tracking-wide bg-[#F5E6E8] text-[#D97B8A] px-1.5 py-0.5 rounded font-semibold">
                                    {t('admin.current')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {t('admin.weddingMeta', {
                                  users: String(w.userCount),
                                  categories: String(w.categoryCount),
                                })}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setRenamingId(w.id);
                              setRenameValue(w.name);
                            }}
                            title={t('admin.rename')}
                            aria-label={t('admin.rename')}
                            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: 'wedding', id: w.id, name: w.name })}
                            disabled={isCurrent}
                            className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isCurrent ? t('admin.cannotDeleteCurrent') : t('admin.delete')}
                            aria-label={t('admin.delete')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* Accounts */}
            <section className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#D97B8A] to-[#E8B4A1] px-4 py-3">
                <h2 className="text-lg font-bold text-white">{t('admin.accounts')}</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={t('admin.usernamePlaceholder')}
                    className="w-full sm:w-auto sm:flex-1 h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
                    style={{ fontSize: '16px' }}
                  />
                  <select
                    value={newUserWeddingId}
                    onChange={(e) => setNewUserWeddingId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-12 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97B8A]"
                    style={{ fontSize: '16px' }}
                  >
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateUser}
                    className="h-12 px-4 bg-[#D97B8A] text-white rounded-md text-sm font-medium hover:opacity-90 transition"
                  >
                    {t('admin.createAccount')}
                  </button>
                </div>

                <ul className="divide-y divide-gray-100">
                  {visibleUsers.length === 0 && (
                    <li className="py-4 text-sm text-gray-500 text-center">{t('admin.noAccounts')}</li>
                  )}
                  {visibleUsers.map((u) => (
                    <li key={u.id} className="py-3 flex items-center gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{u.username}</span>
                          {u.isAdmin && (
                            <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                              {t('admin.adminBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{weddingName(u.weddingId)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleResetPassword(u)}
                          title={t('admin.resetPassword')}
                          aria-label={t('admin.resetPassword')}
                          className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-3.128c0-.398.158-.78.44-1.06l5.518-5.518c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          disabled={u.id === user?.id && u.isAdmin}
                          title={u.isAdmin ? t('admin.revokeAdmin') : t('admin.grantAdmin')}
                          aria-label={u.isAdmin ? t('admin.revokeAdmin') : t('admin.grantAdmin')}
                          className={`p-2 rounded-md border transition disabled:opacity-40 disabled:cursor-not-allowed ${u.isAdmin ? 'bg-amber-100 text-amber-700 border-amber-200' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPendingDelete({ type: 'user', id: u.id, name: u.username })}
                          disabled={u.id === user?.id}
                          title={u.id === user?.id ? t('admin.cannotDeleteSelf') : t('admin.delete')}
                          aria-label={t('admin.delete')}
                          className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Generated password reveal */}
      {reveal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {t('admin.passwordFor', { username: reveal.username })}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{t('admin.passwordHint')}</p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm text-gray-900 break-all select-all">
                {reveal.password}
              </code>
              <button
                onClick={copyPassword}
                className="px-3 py-2 bg-[#D97B8A] text-white rounded-md text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
              >
                {copied ? t('admin.copied') : t('admin.copy')}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setReveal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition"
              >
                {t('admin.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.type === 'wedding' ? t('admin.deleteWeddingTitle') : t('admin.deleteUserTitle')}
        message={
          pendingDelete?.type === 'wedding'
            ? t('admin.deleteWeddingMessage', { name: pendingDelete?.name ?? '' })
            : t('admin.deleteUserMessage', { name: pendingDelete?.name ?? '' })
        }
      />
    </div>
  );
};
