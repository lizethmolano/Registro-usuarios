import { describe, it, expect } from "vitest";
import {
  firebaseConfig,
  checkIsApiKeyPlaceholder,
  isApiKeyPlaceholder,
  app,
  auth,
  db,
  storage,
} from "./config";

describe("Firebase Configuration & Security", () => {
  describe("checkIsApiKeyPlaceholder (detección de claves inválidas o plantillas)", () => {
    it("debe retornar true si la apiKey es nula, indefinida o vacía", () => {
      expect(checkIsApiKeyPlaceholder(null)).toBe(true);
      expect(checkIsApiKeyPlaceholder(undefined)).toBe(true);
      expect(checkIsApiKeyPlaceholder("")).toBe(true);
      expect(checkIsApiKeyPlaceholder("   ")).toBe(true);
    });

    it("debe retornar true si la apiKey es el texto del archivo .env.example", () => {
      expect(checkIsApiKeyPlaceholder("tu_api_key_de_firebase_aqui")).toBe(true);
    });

    it("debe retornar true si contiene la palabra PEGA_AQUI", () => {
      expect(checkIsApiKeyPlaceholder("AIzaSy_PEGA_AQUI_TEST")).toBe(true);
    });

    it("debe retornar false cuando se proporciona una apiKey real y válida", () => {
      expect(checkIsApiKeyPlaceholder("AIzaSyAE5gtT5m893XAMe5Uac_PVHGppiE3ABXM")).toBe(false);
    });
  });

  describe("firebaseConfig (carga de variables de entorno)", () => {
    it("debe contener la estructura esperada de configuración de Firebase", () => {
      expect(firebaseConfig).toHaveProperty("apiKey");
      expect(firebaseConfig).toHaveProperty("authDomain");
      expect(firebaseConfig).toHaveProperty("projectId");
      expect(firebaseConfig).toHaveProperty("storageBucket");
      expect(firebaseConfig).toHaveProperty("messagingSenderId");
      expect(firebaseConfig).toHaveProperty("appId");
    });

    it("la clave actual no debe ser detectada como un placeholder", () => {
      expect(isApiKeyPlaceholder).toBe(false);
    });
  });

  describe("Instancias de servicios Firebase", () => {
    it("debe inicializar la app de Firebase correctamente", () => {
      expect(app).toBeDefined();
      expect(app.name).toBe("[DEFAULT]");
    });

    it("debe inicializar los servicios Auth, Firestore y Storage", () => {
      expect(auth).toBeDefined();
      expect(db).toBeDefined();
      expect(storage).toBeDefined();
    });
  });
});
