'use client';

import SecretInput from './SecretInput';

export default function AdminLoginForm() {
  return (
    <form className="adm-login-card" action="/api/admin/login" method="POST">
      <div className="adm-login-brand">
        <span className="brand-mark">☯</span>
        <div>
          <div className="adm-login-name">真和盛</div>
          <div className="adm-login-sub">管理后台 · Zhen He Sheng</div>
        </div>
      </div>
      <h1>员工登录</h1>
      <label>
        工号
        <input name="username" autoComplete="username" placeholder="ZHSM001" required />
      </label>
      <label>
        密码
        <SecretInput
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>
      <button className="btn btn-solid" type="submit" style={{ width: '100%', marginTop: '12px' }}>
        登 录
      </button>
      <p className="adm-login-note">仅限内部员工访问 · 登录状态 12 小时内有效</p>
    </form>
  );
}
