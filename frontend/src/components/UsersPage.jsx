import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminUsersAPI, authAPI } from '../api';

function UsersPage() {
    const { t } = useTranslation();
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lastInviteLink, setLastInviteLink] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        is_admin: false,
    });

    const fetchUsers = async () => {
        const data = await adminUsersAPI.getUsers();
        setUsers(data);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const me = await authAPI.getCurrentUser();
                setCurrentUser(me);

                if (!me.is_admin) {
                    setError(t('users.adminOnly'));
                    return;
                }

                await fetchUsers();
            } catch (err) {
                setError(err.response?.data?.detail || t('users.loadError'));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [t]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await adminUsersAPI.inviteUser(formData);
            setLastInviteLink(response.invite_link);
            setSuccess(t('users.inviteSuccess'));
            setFormData({
                username: '',
                email: '',
                is_admin: false,
            });
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.detail || t('users.inviteError'));
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = async () => {
        if (!lastInviteLink) return;

        try {
            await navigator.clipboard.writeText(lastInviteLink);
            setSuccess(t('users.linkCopied'));
        } catch {
            setError(t('users.copyError'));
        }
    };

    if (loading) {
        return <div className="text-slate-500">{t('loading')}</div>;
    }

    if (!currentUser?.is_admin) {
        return (
            <div className="card max-w-3xl">
                <p className="text-red-600">{error || t('users.adminOnly')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('users.title')}</h1>
                <p className="text-slate-600 mt-1">{t('users.subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
                <section className="card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('users.formTitle')}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="invite-username" className="block text-sm font-medium text-slate-700 mb-2">
                                {t('users.username')}
                            </label>
                            <input
                                id="invite-username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700 mb-2">
                                {t('users.email')}
                            </label>
                            <input
                                id="invite-email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                                name="is_admin"
                                type="checkbox"
                                checked={formData.is_admin}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            {t('users.grantAdmin')}
                        </label>

                        <button type="submit" disabled={saving} className="btn-primary w-full">
                            {saving ? t('users.sending') : t('users.sendInvite')}
                        </button>
                    </form>

                    {(error || success) && (
                        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                            {error || success}
                        </div>
                    )}

                    {lastInviteLink && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">{t('users.lastInvite')}</p>
                            <p className="break-all rounded-md bg-white px-3 py-2 text-sm text-slate-600 border border-slate-200">{lastInviteLink}</p>
                            <button type="button" className="btn-secondary mt-3" onClick={handleCopyLink}>
                                {t('users.copyLink')}
                            </button>
                        </div>
                    )}
                </section>

                <section className="card overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">{t('users.listTitle')}</h2>
                        <span className="text-sm text-slate-500">{users.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">{t('users.username')}</th>
                                    <th className="px-4 py-3">{t('users.email')}</th>
                                    <th className="px-4 py-3">{t('users.role')}</th>
                                    <th className="px-4 py-3">{t('users.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-t border-slate-200">
                                        <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            {user.is_admin ? t('users.roleAdmin') : t('users.roleUser')}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.password_setup_completed ? t('users.statusActive') : t('users.statusInvited')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default UsersPage;
