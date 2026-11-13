// Login page (DEMO): phone number -> 6-digit code -> demo session in localStorage.
// No SMS is sent and any 6-digit code is accepted. The real flow is built in the backend phase.
import { qs, qsa, readQuery } from '../components/dom.js';
import { toast } from '../components/toast.js';
import { normalizePhone, isValidCode, login, loginWithUsername, isValidUsername, isValidPassword, isLoggedIn } from '../services/authService.js';
import { normalizeDigits, formatNumber } from '../services/format.js';
import { icon as iconSvg } from '../components/icons.js';

const RESEND_SECONDS = 60;

/** Only same-site paths are allowed as the post-login destination (prevents open redirects). */
function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.startsWith('/login')) return '/';
  return value;
}

export function init() {
  const next = safeNext(readQuery().get('next'));
  if (isLoggedIn()) {
    location.replace(next);
    return;
  }

  // ---- method tabs: username/password  |  SMS ----
  const tabs = qsa('[data-auth-tab]');
  const panels = qsa('[data-auth-panel]');
  function selectTab(name, { focus = true } = {}) {
    tabs.forEach((t) => {
      const on = t.dataset.authTab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => (p.hidden = p.dataset.authPanel !== name));
    if (focus) (name === 'sms' ? qs('#phone') : qs('#username')).focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.authTab));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const other = tabs[(i + 1) % tabs.length];
      other.focus();
      selectTab(other.dataset.authTab);
    });
  });

  // ---- username + password (demo) ----
  const pwForm = qs('[data-password-form]');
  const userInput = qs('#username');
  const passInput = qs('#password');
  const userError = qs('[data-username-error]');
  const passError = qs('[data-password-error]');
  const pwLabel = qs('[data-password-label]');
  const eye = qs('[data-toggle-password]');

  const mark = (input, on) => input.closest('.auth-input').toggleAttribute('data-invalid', on);
  userInput.addEventListener('input', () => {
    userError.textContent = '';
    mark(userInput, false);
  });
  passInput.addEventListener('input', () => {
    passError.textContent = '';
    mark(passInput, false);
  });
  eye.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
    eye.innerHTML = iconSvg(show ? 'eye-off' : 'eye');
  });
  pwForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = userInput.value.trim();
    const password = passInput.value;
    let bad = null;
    if (!isValidUsername(username)) {
      userError.textContent = 'نام کاربری ۳ تا ۳۲ کاراکتر و فقط شامل حروف انگلیسی، عدد، نقطه و _ باشد.';
      mark(userInput, true);
      bad = userInput;
    }
    if (!isValidPassword(password)) {
      passError.textContent = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
      mark(passInput, true);
      bad = bad || passInput;
    }
    if (bad) return bad.focus();
    const submit = pwForm.querySelector('[type="submit"]');
    submit.disabled = true;
    pwLabel.textContent = 'در حال ورود…';
    setTimeout(() => {
      loginWithUsername(username);
      location.replace(next);
    }, 350);
  });
  qs('[data-forgot]').addEventListener('click', () => {
    selectTab('sms');
    toast('برای ورود، کد تأیید را با پیامک دریافت کنید. بازیابی رمز واقعی در مرحله بک‌اند ساخته می‌شود.', 'info');
  });

  const stepPhone = qs('[data-step="phone"]');
  const stepOtp = qs('[data-step="otp"]');
  const phoneForm = qs('[data-phone-form]');
  const phoneInput = qs('#phone');
  const phoneError = qs('[data-phone-error]');
  const phoneView = qs('[data-phone-view]');
  const otpForm = qs('[data-otp-form]');
  const digits = qsa('[data-otp-digit]');
  const otpError = qs('[data-otp-error]');
  const timerEl = qs('[data-timer]');
  const resendBtn = qs('[data-resend]');
  let phone = null;
  let timer = null;

  function showStep(name) {
    stepPhone.hidden = name !== 'phone';
    stepOtp.hidden = name !== 'otp';
    (name === 'phone' ? phoneInput : digits[0]).focus();
  }

  function startTimer() {
    clearInterval(timer);
    let left = RESEND_SECONDS;
    resendBtn.disabled = true;
    const tick = () => {
      timerEl.textContent = left > 0 ? `ارسال مجدد تا ${formatNumber(left)} ثانیه دیگر` : '';
      if (left <= 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
      }
      left -= 1;
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  phoneInput.addEventListener('input', () => {
    phoneError.textContent = '';
    phoneInput.removeAttribute('aria-invalid');
  });

  phoneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phoneInput.value);
    if (!normalized) {
      phoneError.textContent = 'شماره موبایل معتبر نیست؛ مثال: ۰۹۱۲۳۴۵۶۷۸۹';
      phoneInput.setAttribute('aria-invalid', 'true');
      phoneInput.focus();
      return;
    }
    phone = normalized;
    phoneView.textContent = phone;
    digits.forEach((d) => (d.value = ''));
    otpError.textContent = '';
    showStep('otp');
    startTimer();
  });

  // One box per digit: auto-advance, backspace, paste.
  digits.forEach((box, i) => {
    box.addEventListener('input', () => {
      otpError.textContent = '';
      const d = normalizeDigits(box.value).replace(/\D/g, '');
      box.value = d.slice(-1);
      if (d && i < digits.length - 1) digits[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) digits[i - 1].focus();
      if (e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
      if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
    });
    box.addEventListener('paste', (e) => {
      const text = normalizeDigits(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, digits.length);
      if (!text) return;
      e.preventDefault();
      [...text].forEach((ch, k) => (digits[k].value = ch));
      digits[Math.min(text.length, digits.length - 1)].focus();
    });
    box.addEventListener('focus', () => box.select());
  });

  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = digits.map((d) => d.value).join('');
    if (!isValidCode(code)) {
      otpError.textContent = 'کد ۶ رقمی را کامل وارد کنید.';
      (digits.find((d) => !d.value) || digits[0]).focus();
      return;
    }
    const submit = otpForm.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'در حال ورود…';
    setTimeout(() => {
      login(phone);
      location.replace(next);
    }, 350);
  });

  qs('[data-back]').addEventListener('click', () => {
    clearInterval(timer);
    showStep('phone');
  });

  resendBtn.addEventListener('click', () => {
    toast('کد جدید ارسال شد (نمایشی)', 'info');
    startTimer();
    digits[0].focus();
  });
}
