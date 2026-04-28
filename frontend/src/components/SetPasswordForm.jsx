import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api';
import LanguageSwitcher from './LanguageSwitcher';

function SetPasswordForm() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
    const [invitation, setInvitation] = useState(null);
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInvitation = async () => {
            if (!token) {
                setError(t('invite.invalid'));
                setLoading(false);
                return;
            }

            try {
                const data = await authAPI.getInvitationInfo(token);
                setInvitation(data);
            } catch (err) {
                setError(err.response?.data?.detail || t('invite.invalid'));
            } finally {
                setLoading(false);
            }
        };

        loadInvitation();
    }, [t, token]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError(t('register.errorPasswordMismatch'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('register.errorPasswordLength'));
            return;
        }

        setSaving(true);
        try {
            await authAPI.setPasswordFromInvitation(token, formData.password);
            navigate('/login', { state: { message: t('invite.successMessage') } });
        } catch (err) {
            setError(err.response?.data?.detail || t('invite.saveError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('invite.title')}</h1>
                    <p className="text-slate-600">{t('invite.subtitle')}</p>
                </div>

                {loading ? (
                    <p className="text-slate-500">{t('loading')}</p>
                ) : error && !invitation ? (
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                        <Link to="/login" className="btn-secondary w-full inline-flex justify-center">
                            {t('signIn')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <p><strong>{t('invite.username')}</strong> {invitation?.username}</p>
                            <p><strong>{t('invite.email')}</strong> {invitation?.email}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    {t('register.password')}
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                    {t('register.confirmPassword')}
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input-field"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={saving} className="btn-primary w-full">
                                {saving ? t('invite.saving') : t('invite.button')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default SetPasswordForm;
