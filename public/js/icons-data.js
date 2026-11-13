// Icon paths (24x24, stroke style). One source for both worlds:
//  - the browser reads window.ICON_PATHS (classic script, loaded before main.js)
//  - the server reads it with require() and exposes it to EJS as `ICONS`
(function (root) {
  var P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    'chev-left': '<path d="m14.5 6-6 6 6 6"/>',
    'chev-right': '<path d="m9.5 6 6 6-6 6"/>',
    'arrow-right': '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    headset:
      '<circle cx="12" cy="9.5" r="3"/><path d="M6.5 21c.7-2.7 2.7-4.2 5.5-4.2s4.8 1.5 5.5 4.2"/><path d="M5.5 11.5V10a6.5 6.5 0 0 1 13 0v1.5"/><rect x="3.8" y="10.5" width="2.6" height="4.4" rx="1.1"/><rect x="17.6" y="10.5" width="2.6" height="4.4" rx="1.1"/><path d="M19 15v1.2a2 2 0 0 1-2 2h-2"/>',
    phone:
      '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A14.5 14.5 0 0 1 4.5 6a2 2 0 0 1 2-2Z"/>',
    sms: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-7Z"/><path d="M8 9h8M8 12h5"/>',
    telegram: '<path d="M20.5 4 3.5 10.7l5.3 2 2 5.8 3-3.6 4.4 3.3L20.5 4Z"/><path d="m8.8 12.7 7.4-5.2"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    pin: '<path d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    image:
      '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3L16 12l4 4"/>',
    watch:
      '<rect x="7" y="6.5" width="10" height="11" rx="3"/><path d="M9 6.5 9.6 3h4.8l.6 3.5M9 17.5 9.6 21h4.8l.6-3.5"/><path d="M12 10v2.3l1.5 1"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    'eye-off': '<path d="M10 6a9 9 0 0 1 2-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.4 3.2M6.2 7.6C3.9 9.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.8-.4 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
    logout: '<path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
    dashboard:
      '<rect x="4" y="4" width="7" height="8" rx="1.5"/><rect x="13" y="4" width="7" height="5" rx="1.5"/><rect x="13" y="11" width="7" height="9" rx="1.5"/><rect x="4" y="14" width="7" height="6" rx="1.5"/>',
    box: '<path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
    list: '<path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    alert: '<path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 10v4M12 16.5v.01"/>',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  else root.ICON_PATHS = P;
})(typeof window !== 'undefined' ? window : globalThis);
