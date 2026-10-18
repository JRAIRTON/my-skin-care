// Only inside the store app (Capacitor): purchases through RevenueCat, exposed as window.MySkinCompras
// for app.js. In the browser this file does nothing.
const C = window.Capacitor;
if (C?.isNativePlatform?.()) {
  const Purchases = C.registerPlugin("Purchases");
  // RevenueCat public SDK keys (they ship inside the app; not secrets). The test key works with the
  // RevenueCat Test Store; swap in the appl_ and goog_ keys once the stores are linked in RevenueCat.
  const CHAVES = {
    ios: "test_WSHWCaaapdEFdDdzEOBEUSskDrE",
    android: "test_WSHWCaaapdEFdDdzEOBEUSskDrE",
  };
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
  window.MySkinCompras = {
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
}
