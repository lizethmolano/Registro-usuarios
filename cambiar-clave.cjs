const admin = require("firebase-admin");

const serviceAccount = require("./registro-usuarios-7b67a-firebase-adminsdk-fbsvc-28f9c097de.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const email = "lizeth.molano@iets.org.co";
const nuevaClave = "Molano0712";

async function cambiarClave() {
  try {
    const usuario = await admin.auth().getUserByEmail(email);

    await admin.auth().updateUser(usuario.uid, {
      password: nuevaClave,
    });

    console.log("CONTRASEÑA CAMBIADA CORRECTAMENTE");
    console.log("Correo:", email);
    console.log("Contraseña:", nuevaClave);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

cambiarClave();