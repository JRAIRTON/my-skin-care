// Only inside the store app (Capacitor): purchases through RevenueCat (window.MySkinCompras) and routine
// and UV reminders as local notifications (window.MySkinAvisos), for app.js. In the browser it does nothing.
const C = window.Capacitor;
if (C?.isNativePlatform?.()) {
  const Purchases = C.registerPlugin("Purchases");
  // RevenueCat public SDK keys (they ship inside the app; not secrets). iOS uses the App Store key; Android
  // still has the Test Store key (store build shows "em breve") until Google Play is linked: swap in goog_.
  const CHAVES = {
    ios: "appl_vyInsrpFsIFGpGKlsimOoihyqxD",
    android: "test_WSHWCaaapdEFdDdzEOBEUSskDrE",
  };
  // while the key is still a test_ key, the store build shows no purchase at all ("em breve"): store review
  // requires Google Play / App Store billing, and the test key opens the RevenueCat Test Store instead
  if (CHAVES[C.getPlatform()]?.startsWith("test_")) window.MySkinEmBreve = true;
  const PACOTE_ROTULOS = "myskincare_rotulos10"; // same id as ROTULOS_PACOTE in server/src/index.js
  const DIREITO = "myskincare_pro";      // analyses (every plan); the server checks the same one
  const FAMILIA = "myskincare_familia";  // up to 4 profiles on the phone (family plans)
  // plan in the app -> package in the RevenueCat "current" offering (docs/etapa8-lojas.md)
  const PACOTES = { mensal: "$rc_monthly", anual: "$rc_annual", familia_mensal: "familia_mensal", familia_anual: "familia_anual" };
  let pronto = null;
  // appUserID = the install id the server receives in X-Usuario, so both sides see the same customer
  const configura = (usuario) => (pronto ||= Purchases.configure({ apiKey: CHAVES[C.getPlatform()], appUserID: usuario }));
  const estado = (info) => {
    const ativos = info?.entitlements?.active || {}, pro = ativos[DIREITO];
    return {
      ativa: !!pro,
      familia: !!ativos[FAMILIA],
      // free trial: when it ends, so the app can remind the person before the first charge
      fimTeste: pro?.periodType === "TRIAL" && pro.expirationDate ? String(pro.expirationDate).slice(0, 10) : null,
    };
  };
  const pacote = async (plano) => {
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages?.find((p) => p.identifier === PACOTES[plano]) || null;
  };
  if (!window.MySkinEmBreve) window.MySkinCompras = {
    // which plans have a free trial for this person (the store only gives it once)
    async ofertas(usuario) {
      await configura(usuario);
      const r = {};
      for (const plano of Object.keys(PACOTES)) {
        const p = await pacote(plano).catch(() => null);
        const intro = p?.product?.introPrice;
        r[plano] = { disponivel: !!p, preco: p?.product?.priceString || null, testeDias: intro && intro.price === 0 ? diasDe(intro) : 0 };
      }
      return r;
    },
    async comprar(plano, usuario) {
      await configura(usuario);
      const p = await pacote(plano);
      if (!p) throw new Error("Este plano não está disponível agora. Tente mais tarde.");
      try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: p });
        return estado(customerInfo);
      } catch (e) {
        if (e?.userCancelled || e?.code === "1") return null; // the person closed the store sheet: nothing changes
        throw e;
      }
    },
    async restaurar(usuario) {
      await configura(usuario);
      const { customerInfo } = await Purchases.restorePurchases();
      return estado(customerInfo);
    },
    // extra label readings: a consumable pack sold by the store (the server counts it in RevenueCat)
    async precoRotulos(usuario) {
      await configura(usuario);
      const { products } = await Purchases.getProducts({ productIdentifiers: [PACOTE_ROTULOS], type: "NON_SUBSCRIPTION" });
      return products?.[0]?.priceString || null;
    },
    async comprarRotulos(usuario) {
      await configura(usuario);
      const { products } = await Purchases.getProducts({ productIdentifiers: [PACOTE_ROTULOS], type: "NON_SUBSCRIPTION" });
      if (!products?.length) throw new Error("O pacote de leituras não está disponível agora. Tente mais tarde.");
      try {
        await Purchases.purchaseStoreProduct({ product: products[0] });
        return true;
      } catch (e) {
        if (e?.userCancelled || e?.code === "1") return false;
        throw e;
      }
    },
    async direitos(usuario) {
      await configura(usuario);
      const { customerInfo } = await Purchases.getCustomerInfo();
      return estado(customerInfo);
    },
  };
  const diasDe = (i) => {
    const n = i.periodNumberOfUnits || 1, u = String(i.periodUnit || "DAY").toUpperCase();
    return u.startsWith("W") ? 7 * n : u.startsWith("M") ? 30 * n : u.startsWith("Y") ? 365 * n : n;
  };

  // routine and UV reminders: local notifications scheduled on the phone (no server, no push service).
  // Our ids are 7000-7999, so other notifications are never touched.
  const Avisos = C.registerPlugin("LocalNotifications");
  const NOSSOS = (id) => id >= 7000 && id < 8000;
  window.MySkinAvisos = {
    async permitido(pedir = false) {
      const p = await Avisos.checkPermissions();
      if (p.display === "granted") return true;
      if (!pedir) return false;
      return (await Avisos.requestPermissions()).display === "granted";
    },
    // lista: [{ id, titulo, texto, quando: Date, extra }]; replaces every reminder of ours
    async agenda(lista) {
      const { notifications } = await Avisos.getPending();
      const velhos = (notifications || []).filter((n) => NOSSOS(Number(n.id)));
      if (velhos.length) await Avisos.cancel({ notifications: velhos.map((n) => ({ id: Number(n.id) })) });
      if (!lista.length) return;
      await Avisos.schedule({ notifications: lista.map((n) => ({
        id: n.id, title: n.titulo, body: n.texto, extra: n.extra || {},
        // reminders need not be exact to the minute: no "alarms & reminders" permission on Android
        schedule: { at: n.quando, allowWhileIdle: true }, isExactNotification: false,
      })) });
    },
  };
  // tapping a reminder opens the screen it is about (kept until app.js is ready to read it)
  Avisos.addListener("localNotificationActionPerformed", (a) => {
    window.MySkinAvisoAberto = a?.notification?.extra || {};
    window.dispatchEvent(new CustomEvent("myskin-aviso", { detail: window.MySkinAvisoAberto }));
  });
}
