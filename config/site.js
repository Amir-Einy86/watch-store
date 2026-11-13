// Single source of truth for brand, contact details and categories.
// Server views read it as `site`; the browser reads the same object as `window.SITE`.
//
// Contact values are null on purpose: they were not provided yet, so the site shows
// "coming soon" instead of inventing numbers. Fill them in here and every page updates.

module.exports = {
  brand: {
    name: 'TIMELESS',
    nameFa: 'تایم‌لس',
    tagline: 'WATCH STORE',
  },
  // 'ltr' as requested. Change to 'rtl' to flip the whole layout (CSS uses logical properties).
  dir: 'ltr',
  lang: 'fa',
  currency: 'تومان',
  contact: {
    phone: null, // e.g. '+98 21 0000 0000'
    sms: null, // SMS support number
    telegram: null, // Telegram username without @
    email: null,
    address: null,
    hours: null,
  },
  categories: {
    men: {
      key: 'men',
      titleFa: 'ساعت مردانه',
      titleEn: 'Men',
      script: 'Men',
      blurb: 'ساعت‌های مردانه؛ از کلاسیک و کرونوگراف تا اسپرت.',
    },
    women: {
      key: 'women',
      titleFa: 'ساعت زنانه',
      titleEn: 'Women',
      script: 'Women',
      blurb: 'ساعت‌های زنانه؛ ظریف، درخشان و روزمره.',
    },
    smart: {
      key: 'smart',
      titleFa: 'ساعت هوشمند',
      titleEn: 'Smart',
      script: 'Smart',
      blurb: 'ساعت‌های هوشمند برای سلامت، ارتباط و ورزش.',
    },
  },
};
