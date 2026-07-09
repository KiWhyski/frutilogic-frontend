const SESSION_KEYS = [
    'token',
    'userId',
    'username',
    'accountId',
    'accountRole',
    'currentAccount',
];

export function parseAuthResponse(data) {
    return {
        id: String(data?.userId ?? data?.UserId ?? data?.id ?? ''),
        username: String(data?.username ?? data?.Username ?? data?.email ?? data?.Email ?? ''),
        email: String(data?.email ?? data?.Email ?? data?.username ?? data?.Username ?? ''),
        token: String(data?.token ?? data?.Token ?? ''),
        accountId: String(data?.accountId ?? data?.AccountId ?? ''),
        accountRole: String(data?.accountRole ?? data?.AccountRole ?? data?.role ?? data?.Role ?? ''),
    };
}

export function persistSession(session) {
    if (session.token) localStorage.setItem('token', session.token);
    if (session.id) localStorage.setItem('userId', session.id);
    if (session.username) localStorage.setItem('username', session.username);
    if (session.accountId) localStorage.setItem('accountId', session.accountId);
    if (session.accountRole) localStorage.setItem('accountRole', session.accountRole);

    localStorage.setItem('currentAccount', JSON.stringify({
        accountId: session.accountId,
        accountRole: session.accountRole,
        username: session.username,
    }));
}

export function clearSession() {
    for (const key of SESSION_KEYS) {
        localStorage.removeItem(key);
    }
    localStorage.removeItem('currentUser');
    localStorage.removeItem('devBypassAuth');
    localStorage.removeItem('recoveryEmail');
}

export function hasValidSession() {
    const token = localStorage.getItem('token');
    return Boolean(token && token !== 'dev-local-preview-token');
}
