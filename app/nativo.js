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
  const DIREITO = "myskincare_pro"; // same entitlement the server checks
  let pronto = null;
  // appUserID = the install id the server receives in X-Usuario, so both sides see the same customer
  const configura = (usuario) => (pronto ||= Purchases.configure({ apiKey: CHAVES[C.getPlatform()], appUserID: usuario }));
  const ativa = (info) => !!info?.entitlements?.active?.[DIREITO];
  window.MySkinCompras = {
    async comprar(plano, usuario) {
      await configura(usuario);
      const { current } = await Purchases.getOfferings();
      const pacote = plano === "anual" ? current?.annual : current?.monthly;
      if (!pacote) throw new Error("Este plano não está disponível agora. Tente mais tarde.");
      try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pacote });
        return ativa(customerInfo);
      } catch (e) {
        if (e?.userCancelled || e?.code === "1") return false; // the person closed the store sheet
        throw e;
      }
    },
    async restaurar(usuario) {
      await configura(usuario);
      const { customerInfo } = await Purchases.restorePurchases();
      return ativa(customerInfo);
    },
  };
}
