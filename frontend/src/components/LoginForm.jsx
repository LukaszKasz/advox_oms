import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, tokenManager } from '../api';
import LanguageSwitcher from './LanguageSwitcher';

function LoginForm() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setError('');
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData.username, formData.password);
            tokenManager.setToken(response.access_token);
            navigate('/orders');
        } catch (err) {
            setError(
                err.response?.data?.detail || t('login.errorInvalid')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('login.title')}</h1>
                    <p className="text-slate-600">{t('login.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {location.state?.message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            {location.state.message}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                            {t('login.username')}
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input-field"
                            placeholder={t('login.usernamePlaceholder')}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                            {t('login.password')}
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            placeholder={t('login.passwordPlaceholder')}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? t('login.buttonLoading') : t('login.button')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-600">
                        {t('login.noAccount')}{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                            {t('signUp')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;
