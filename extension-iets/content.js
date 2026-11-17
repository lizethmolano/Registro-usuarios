// ============================================================================
// Autollenador Inteligente - Repositorio Institucional IETS
// Extensión para Google Chrome (Versión 2.0)
// ============================================================================

(function () {
    "use strict";

    // Configurar PDF.js worker para extensión Chrome MV3
    // Los workers de chrome-extension:// son bloqueados por CSP del sitio externo,
    // por eso usamos chrome.runtime.getURL para obtener la URL accesible del worker
    if (typeof pdfjsLib !== "undefined") {
        try {
            // Intentar con el worker real (mejor rendimiento, evita bloqueo CSP)
            const workerUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
                ? chrome.runtime.getURL("pdf.worker.min.js")
                : "";
            if (workerUrl) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            } else {
                // Fallback: FakeWorker (hilo principal, sin worker separado)
                pdfjsLib.GlobalWorkerOptions.workerSrc = "";
            }
        } catch (e) {
            // Si cualquier configuración falla, intentar sin worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        }
    }

    const CARGOS_KEYWORDS = new Set([
        "ministro", "ministra", "viceministro", "viceministra", "secretario", "secretaria",
        "director", "directora", "subdirector", "subdirectora", "gerente",
        "coordinador", "coordinadora", "líder", "lider", "jefe", "jefatura",
        "asesor", "asesora", "profesional", "especialista", "consultor", "consultora",
        "investigador", "investigadora", "analista", "asistente", "técnico", "tecnico", "técnica", "tecnica",
        "gestor", "gestora", "médico", "médica", "medico", "medica", "cirujano", "cirujana", "economista",
        "psicólogo", "psicóloga", "psicologo", "psicologa", "químico", "química", "quimico", "quimica",
        "enfermero", "enfermera", "epidemiólogo", "epidemióloga", "epidemiologo", "epidemiologa",
        "bacteriólogo", "bacterióloga", "bacteriologo", "bacteriologa", "estadístico", "estadística", "estadistico", "estadistica",
        "abogado", "abogada", "revisor", "revisora", "par", "pares", "participante", "participantes",
        "presidente", "presidenta", "vicepresidente", "microbiólogo", "microbióloga", "microbiologo", "microbiologa",
        "matemático", "matemática", "matematico", "matematica", "biólogo", "bióloga", "biologo", "biologa"
    ]);

    const INSTITUCIONALES_NO_PERSONA = new Set([
        "ministerio", "instituto", "iets", "salud", "protección", "proteccion", "social", "sociales",
        "pública", "publica", "público", "publico", "servicios", "servicio", "prestación", "prestacion",
        "atención", "atencion", "primaria", "primario", "despacho", "dirección", "direccion",
        "subdirección", "subdireccion", "gerencia", "unidad", "unidades", "grupo", "grupos", "área", "area", "áreas", "areas",
        "gestión", "gestion", "riesgo", "calidad", "proyectos", "proyecto", "operaciones", "medicamentos", "medicamento",
        "tecnologías", "tecnologias", "tecnología", "tecnologia", "promoción", "promocion", "prevención", "prevencion",
        "general", "generalidades", "ejecutiva", "ejecutivo", "enfermedades", "enfermedad", "transmisibles", "desarrollo",
        "encargada", "funciones", "versiones", "finales", "final", "virus", "papiloma", "humano", "dengue", "meningococo",
        "vacuna", "vacunas", "estudio", "estudios", "carga", "componente", "componentes", "entregable", "informe",
        "documento", "guía", "guia", "guias", "guías", "protocolo", "protocolos", "alogenosis", "síndrome", "sindrome",
        "asia", "implantes", "mamarios", "año", "ano", "título", "titulo", "tabla", "contenido", "resumen", "versión", "version",
        "derechos", "autor", "autores", "colombia", "bogotá", "bogota", "orden", "sentencia", "línea", "linea", "base",
        "apreciación", "apreciacion", "crítica", "critica", "equipo", "redacción", "redaccion",
        "analítico", "analíticos", "analítica", "analíticas", "analitico", "analiticos", "analitica", "analiticas",
        "actuarial", "actuariales", "económico", "económicos", "económica", "económicas", "economico", "economicos", "economica", "economicas",
        "economía", "economia", "sanitario", "sanitarios", "sanitaria", "sanitarias",
        "hospital", "hospitales", "hospitalario", "hospitalaria", "universidad", "universidades",
        "centro", "centros", "laboratorio", "laboratorios", "departamento", "departamentos",
        "división", "division", "facultad", "facultades", "fuerza", "fuerzas", "ampliada", "ampliado",
        "retirada", "retirado", "ciencias", "ciencia", "ingeniería", "ingenieria", "industrial",
        "clínica", "clínico", "clínicos", "clínicas", "clinica", "clinico", "clinicos", "clinicas",
        "evidencia", "metodología", "metodologia", "revisores", "revisor", "revisora", "expertos", "experto", "experta",
        "biología", "biologia", "química", "quimica", "farmacología", "farmacologia", "epidemiología", "epidemiologia",
        "bioética", "bioetica", "matemáticas", "matematicas", "neurociencias", "comportamiento", "ambiente", "ambiental",
        "colectiva", "biomédica", "biomedica", "biomédicas", "biomedicas", "tropical", "síntesis", "sintesis"
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    function limpiarTextoGramatical(texto) {
        if (!texto) return "";
        let t = texto;
        // Unir partículas gramaticales separadas erróneamente por kerning o fuentes de PDF
        t = t.replace(/\bd\s+e\b/gi, (m) => m[0] === "D" ? "De" : "de");
        t = t.replace(/\bd\s+el\b/gi, (m) => m[0] === "D" ? "Del" : "del");
        t = t.replace(/\bd\s+e\s+l\b/gi, (m) => m[0] === "D" ? "Del" : "del");
        t = t.replace(/\be\s+l\b/gi, (m) => m[0] === "E" ? "El" : "el");
        t = t.replace(/\bl\s+a\b/gi, (m) => m[0] === "L" ? "La" : "la");
        t = t.replace(/\bl\s+o\s+s\b/gi, (m) => m[0] === "L" ? "Los" : "los");
        t = t.replace(/\bl\s+a\s+s\b/gi, (m) => m[0] === "L" ? "Las" : "las");
        t = t.replace(/\be\s+n\b/gi, (m) => m[0] === "E" ? "En" : "en");
        t = t.replace(/\bp\s+ara\b/gi, (m) => m[0] === "P" ? "Para" : "para");
        t = t.replace(/\bp\s+a\s+r\s+a\b/gi, (m) => m[0] === "P" ? "Para" : "para");
        t = t.replace(/\by\s*\/\s*o\b/gi, "y/o");
        // Quitar espacios antes de signos de puntuación (ej: 'Espera .' -> 'Espera.')
        t = t.replace(/\s+([.,;:!?])/g, "$1");
        // Normalizar espacios múltiples
        t = t.replace(/[ \t]{2,}/g, " ");
        return t.trim();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // EXTRACCIÓN DE TEXTO DEL PDF
    // ──────────────────────────────────────────────────────────────────────────
    async function extraerTextoPdf(file) {
        if (typeof pdfjsLib === "undefined") {
            throw new Error("PDF.js no está cargado. Verifica que la extensión tenga el archivo pdf.min.js.");
        }
        const arrayBuffer = await file.arrayBuffer();
        let doc;
        try {
            // Intento principal: con worker configurado
            doc = await pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                disableFontFace: true,
                disableRange: true,
                disableStream: true
            }).promise;
        } catch (workerErr) {
            console.warn("[IETS] Worker falló, reintentando sin worker:", workerErr.message);
            // Fallback: deshabilitar worker completamente
            pdfjsLib.GlobalWorkerOptions.workerSrc = "";
            doc = await pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                disableFontFace: true,
                disableRange: true,
                disableStream: true,
                useWorkerFetch: false,
                isEvalSupported: false
            }).promise;
        }
        const totalPaginas = doc.numPages;

        // Toda la información requerida (Título, Autores en pág 2, Tabla de Metodología, Resumen)
        // se encuentra en las primeras 8 páginas. Reducir a 8 páginas pasa la extracción de 30s a <0.5s.
        // Leer todas las páginas si <= 60 (cubre anexos de participantes en documentos de 2013 a 2019)
        // Si tiene > 60 páginas, leer las primeras 15 y las últimas 15 páginas
        const paginasALeer = [];
        if (totalPaginas <= 60) {
            for (let p = 1; p <= totalPaginas; p++) paginasALeer.push(p);
        } else {
            for (let p = 1; p <= 15; p++) paginasALeer.push(p);
            for (let p = Math.max(16, totalPaginas - 14); p <= totalPaginas; p++) paginasALeer.push(p);
        }
        const limite = paginasALeer.length;
        const paginasTexto = {};
        for (let num of paginasALeer) {
            const page = await doc.getPage(num);
            const tc = await page.getTextContent();
            let lastY, lastX, lastW;
            let lines = [];
            let cur = "";

            for (const item of tc.items) {
                if (!item.str && item.hasEOL) {
                    if (cur.trim()) lines.push(limpiarTextoGramatical(cur.trim()));
                    cur = "";
                    lastY = undefined;
                    lastX = undefined;
                    continue;
                }
                if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
                    if (cur.trim()) lines.push(limpiarTextoGramatical(cur.trim()));
                    cur = "";
                    lastX = undefined;
                }

                if (lastX !== undefined && lastW !== undefined) {
                    const gap = item.transform[4] - (lastX + lastW);
                    if (gap > 2.5 && !cur.endsWith(" ") && !item.str.startsWith(" ")) {
                        cur += " ";
                    }
                }
                cur += item.str;
                lastY = item.transform[5];
                lastX = item.transform[4];
                lastW = item.width;
            }
            if (cur.trim()) lines.push(limpiarTextoGramatical(cur.trim()));
            paginasTexto[num] = lines.join("\n");
        }

        return {
            totalPaginas,
            pag1: paginasTexto[1] || "",
            pag2: paginasTexto[2] || "",
            paginasTexto: paginasTexto,
            portada: Object.values(paginasTexto).slice(0, 5).join("\n"),
            todo: Object.values(paginasTexto).join("\n"),
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // REGLAS DE NEGOCIO: TÍTULO, AUTORES DE PORTADA, RESUMEN, ETC.
    // ──────────────────────────────────────────────────────────────────────────
    function esAutorExcluido(val) {
        if (!val) return false;
        let nombre = "";
        if (typeof val === "string") {
            nombre = val;
        } else if (typeof val === "object" && val.name && typeof val.name === "string") {
            nombre = val.name;
        } else {
            nombre = String(val);
        }
        if (!nombre.trim()) return false;

        const norm = nombre
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        // 1. Exclusión total de Adriana María Robayo García y cualquier variante
        if (norm.includes("robayo")) return true;
        if (norm.includes("adriana") && (norm.includes("maria") || norm.includes("garcia") || norm.includes("directora") || norm.includes("ejecutiva"))) return true;

        // 2. Exclusión total de Luz Mery Barragán González y cualquier variante
        if (norm.includes("barragan")) return true;
        if (norm.includes("luz") && norm.includes("mery")) return true;

        // 3. Exclusión de Ministros, Viceministros y Secretarios Generales
        if (norm.includes("jaramillo martinez") || (norm.includes("guillermo") && norm.includes("jaramillo"))) return true;
        if (norm.includes("avila plazas") || (norm.includes("german") && norm.includes("avila"))) return true;
        if (norm.includes("ruiz gomez") || (norm.includes("fernando") && norm.includes("ruiz"))) return true;
        if (norm.includes("gaviria uribe") || (norm.includes("alejandro") && norm.includes("gaviria"))) return true;
        if (norm.includes("londono soto") || (norm.includes("beatriz") && norm.includes("londono"))) return true;
        if (norm.includes("santamaria salamanca") || (norm.includes("mauricio") && norm.includes("santamaria"))) return true;
        if (norm.includes("martinez saldarriaga") || (norm.includes("luis alberto") && norm.includes("martinez"))) return true;
        if (norm.includes("urrego rodriguez") || (norm.includes("jaime hernan") && norm.includes("urrego"))) return true;
        if (norm.includes("moscoso osorio") || (norm.includes("alexander") && norm.includes("moscoso"))) return true;
        if (norm.includes("godoy casadiego") || (norm.includes("andrea") && norm.includes("godoy"))) return true;
        if (norm.includes("munoz munoz") || (norm.includes("norman julio") && norm.includes("munoz"))) return true;
        if (norm.includes("davila guerrero") || norm.includes("davila marin")) return true;
        if (norm.includes("gonzalez ortiz") || (norm.includes("ivan dario") && norm.includes("gonzalez"))) return true;
        if (norm.includes("guzman cruz") || (norm.includes("javier humberto") && norm.includes("guzman"))) return true;
        if (norm.includes("salas figueroa") || (norm.includes("rodolfo") && norm.includes("salas"))) return true;
        if (norm.includes("burgos bernal") || (norm.includes("gerardo") && norm.includes("burgos"))) return true;

        // 4. Exclusión de Directores Ejecutivos y Subdirectores IETS
        if (norm.includes("hector eduardo castro") || norm.includes("castro jaramillo") || (norm.includes("hector") && norm.includes("castro"))) return true;
        if (norm.includes("jaime calderon herrera") || (norm.includes("jaime") && norm.includes("calderon"))) return true;
        if (norm.includes("salamanca rincon") || (norm.includes("javier") && norm.includes("salamanca"))) return true;
        if (norm.includes("coral cordoba") || norm.includes("amanda isabel coral") || norm.includes("amanda coral")) return true;
        if (norm.includes("vargas pelaez") || norm.includes("claudia marcela vargas") || norm.includes("claudia vargas")) return true;
        if (norm.includes("pinzon la rotta") || (norm.includes("luis guillermo") && norm.includes("pinzon"))) return true;
        if (norm.includes("hernandez pinto") || (norm.includes("nelson david") && norm.includes("hernandez"))) return true;
        if (norm.includes("manrique mojica") || (norm.includes("sandra consuelo") && norm.includes("manrique"))) return true;
        if (norm.includes("john edison betancur") || norm.includes("arregoces") || norm.includes("yaneth giha")) return true;

        // 5. Exclusión de denominaciones de cargos directivos institucionales
        if (norm.includes("directora ejecutiva") || norm.includes("director ejecutivo") ||
            norm.includes("direccion general") || norm.includes("subdirectora") ||
            norm.includes("subdirector") || norm.includes("subdireccion")) {
            return true;
        }

        return false;
    }

    

        // ──────────────────────────────────────────────────────────────────────────
    // EXTRACCIÓN DE AUTORES ROBUSTA (TODOS LOS AÑOS 2013-2026)
    // ──────────────────────────────────────────────────────────────────────────
    function limpiarNombrePuro(str) {
        if (!str) return null;
        if (esAutorExcluido(str)) return null;
        let clean = str.replace(/^(?:Dra?\.|Dr\.|Lic\.|Ing\.|Ft\.|MD|MSc|PhD|Enf\.|Esp\.|Mag[ií]ster)\s+/i, "").trim();
        clean = clean.replace(/^(?:Dra?\.|Dr\.|Lic\.|Ing\.|Ft\.|MD|MSc|PhD|Enf\.|Esp\.|Mag[ií]ster)\s+/i, "").trim();
        clean = clean.replace(/[.,;:]+$/, "").trim();
        if (esAutorExcluido(clean)) return null;
        if (/[0-9\(\)\/\\_=\[\]\"\?\!\:\;\+\*]/.test(clean)) return null;

        const partes = clean.split(/\s+/).filter(Boolean);
        if (partes.length < 2 || partes.length > 5) return null;

        for (const p of partes) {
            if (/^[A-Z]{3,}$/.test(p)) return null;
            const low = p.toLowerCase();
            const nw = low.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (CARGOS_KEYWORDS.has(low) || INSTITUCIONALES_NO_PERSONA.has(low) || CARGOS_KEYWORDS.has(nw) || INSTITUCIONALES_NO_PERSONA.has(nw)) {
                return null;
            }
        }

        const preps = new Set(["de", "del", "la", "las", "los", "y", "e", "van", "von", "da", "di"]);
        for (const p of partes) {
            if (preps.has(p.toLowerCase())) continue;
            if (p[0] !== p[0].toUpperCase()) return null;
        }
        return clean;
    }

    function parsearLineaAutor(linea) {
        if (!linea || typeof linea !== "string") return null;
        let l = linea.trim();
        if (l.length < 3 || l.length > 300) return null;
        if (esAutorExcluido(l)) return null;

        // Ignorar líneas que comienzan con conectores o preposiciones (continuación de afiliación previa)
        if (/^(?:de\s+|en\s+|el\s+|la\s+|los\s+|las\s+|y\s+|del\s+|al\s+|por\s+|para\s+|con\s+)/i.test(l)) {
            return null;
        }

        // Ignorar subencabezados de equipo, comités o expertos
        if (/^\s*(?:Expertos\s+tem[aá]ticos|Expertos\s+metod[oó]logos|Equipo\s+UIS|Equipo\s+IETS|Revisi[oó]n\s+por\s+pares)\b/i.test(l)) {
            return null;
        }

        // Ignorar líneas que comienzan con instituciones, cargos o grados
        if (/^(?:Centro|Instituto|Dermatol|Hospital|Universidad|Unidad|Servicio|Epidemiolog|Salud|Estudio|Área|Grupo|Dirección|Subdirección|Gerencia|Secretaría|Viceministerio|Ministerio|Consultor|Laboratorio|Programa|División|Facultad|Escuela|Comité|Red|Asociación|Corporación|Sociedad|Fondo|Organización|Organismo|Fuerza|PhD|MSc|Mag[ií]ster|Esp\.|Qu[ií]mic|Enferm|M[eé]dic|Economista|Ingenier|Microbiól|Matemát|Biólog)\b/i.test(l)) {
            return null;
        }

        // Ignorar líneas que comiencen con siglas tipo 'DLQI', 'ETES'
        if (/^[A-Z0-9\-]{2,10}\s+[A-Z]/.test(l) && !/^(?:Dr|Lic|Ing|Ft|MD)/i.test(l)) return null;

        // Caso 1: 'Apellido(s), Nombre(s) [. , - –] Rol o Profesión' (Formato estándar en documentos IETS)
        const mApNom = l.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\-\s]{2,40}),\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\-\s]{2,40})(?:\.|\,|\s*[-–])\s*(.*)$/);
        if (mApNom) {
            const ap = mApNom[1].trim();
            const nom = mApNom[2].trim();
            const rol = mApNom[3].trim() || "Autor principal";

            const palabrasInst = /\b(?:estudios?|unidad(?:es)?|direcci[oó]n|subdirecci[oó]n|gerencia|departamento|facultad|universidad|instituto|hospital|servicio|ministerio|secretar[ií]a|asociaci[oó]n|sociedad|corporaci[oó]n|comit[eé]|fuerza|grupo|salud|evaluaci[oó]n|sanitari[ao]s?|anal[ií]tic[ao]s?|actuarial(?:es)?|econ[oó]mic[ao]s?)\b/i;
            if (palabrasInst.test(ap) || palabrasInst.test(nom)) {
                return null;
            }

            const tokens = `${ap} ${nom}`.toLowerCase().split(/\s+/).filter(Boolean);
            for (const t of tokens) {
                const nw = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (INSTITUCIONALES_NO_PERSONA.has(t) || INSTITUCIONALES_NO_PERSONA.has(nw) || CARGOS_KEYWORDS.has(t) || CARGOS_KEYWORDS.has(nw)) {
                    return null;
                }
            }

            if (!/\d/.test(ap) && !/\d/.test(nom)) {
                const nomCompleto = `${nom} ${ap}`;
                if (!esAutorExcluido(nomCompleto) && !/hospital|instituto|universidad|servicio|unidad|departamento|ministerio|estudio|analític/i.test(nomCompleto)) {
                    return { name: nomCompleto, role: rol };
                }
            }
        }

        // Caso 2: 'Nombre (Siglas). Rol' o 'Nombre. Rol'
        const mNomDot = l.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\-]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\-]+){1,4})(?:\s*\([A-Z]+\))?\.\s+(.+)$/);
        if (mNomDot) {
            const nomCand = limpiarNombrePuro(mNomDot[1].trim());
            const rol = mNomDot[2].trim();
            if (nomCand && !/hospital|instituto|universidad|servicio|unidad|departamento|ministerio|expertos/i.test(nomCand)) {
                return { name: nomCand, role: rol };
            }
        }

        // Caso 3: 'Rol: Nombre'
        const mColon = l.match(/^(?:L[ií]der|Coordinador(?:a)?|Profesional|Investigador(?:a)?|Consultor(?:a)?|Asesor(?:a)?|Revisor(?:a)?|Epidemi[oó]log[oa]|Economista)[^:]*:\s*(.+)$/i);
        if (mColon) {
            const rol = l.slice(0, l.indexOf(":")).trim();
            const nom = limpiarNombrePuro(mColon[1]);
            if (nom && !esAutorExcluido(nom)) return { name: nom, role: rol };
        }

        // Caso 4: 'Nombre - Cargo' o 'Nombre (Cargo)' o 'Nombre, Cargo'
        if (l.includes(" - ") || l.includes(" – ") || l.includes(" (") || (l.includes(",") && !mApNom)) {
            const sep = l.includes(" - ") ? " - " : (l.includes(" – ") ? " – " : (l.includes(" (") ? " (" : ","));
            const partes = l.split(sep, 2);
            const nomCand = partes[0].trim();
            const nom = limpiarNombrePuro(nomCand);
            if (nom && !esAutorExcluido(nom) && !/hospital|instituto|universidad|servicio|unidad|departamento|ministerio/i.test(nom)) {
                let rol = partes[1] ? partes[1].replace(/\)$/, "").trim() : "Autor principal";
                return { name: nom, role: rol || "Autor principal" };
            }
        }

        // Caso 5: Solo el nombre en la línea (Nombre Apellido)
        const nomPuro = limpiarNombrePuro(l);
        if (nomPuro && !esAutorExcluido(nomPuro) && !/hospital|instituto|universidad|servicio|unidad|departamento|ministerio/i.test(nomPuro)) {
            return { name: nomPuro, role: "Autor principal" };
        }

        return null;
    }

    function esNombrePersona(str) {
        const item = parsearLineaAutor(str);
        return item ? item.name : null;
    }

    function extraerAutoresYContactos(textoPag1, textoPag2, paginasTexto) {
        const autores = [];
        const contactos = [];
        const nombresVistos = new Set();
        const paginas = paginasTexto || { 1: textoPag1 || "", 2: textoPag2 || "" };

        function agregarAutor(nom, rol) {
            if (!nom || esAutorExcluido(nom)) return;
            const normKey = nom.toLowerCase().trim();
            if (!nombresVistos.has(normKey)) {
                nombresVistos.add(normKey);
                autores.push(nom);
                contactos.push({ name: nom, role: rol || "Autor principal", email: "" });
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // REGLA 1: IDENTIFICACIÓN DEL ENCABEZADO EXPLÍCITO 'AUTORES'
        // Busca en TODO el documento (sin forzar la segunda hoja) el bloque
        // que dice 'Autores', 'Autor(es)', 'Autores y colaboradores', etc.
        // ──────────────────────────────────────────────────────────────────────
        for (const [numStr, pText] of Object.entries(paginas)) {
            if (!pText) continue;
            const num = parseInt(numStr, 10);
            const lineas = pText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i];
                if (/^\s*(?:[0-9\.\-\–\s]*\s*)?(?:Autores|Autores\s+del\s+documento|Autores\s+y\s+colaboradores|Equipo\s+de\s+autores|Grupo\s+de\s+autores|Autores\s+principales|Autores\s+técnicos)\s*:?\s*$/i.test(linea)) {
                    console.log(`[IETS] 🎯 Identificado bloque 'Autores' en página ${num} (línea ${i+1}: "${linea}")`);
                    let llegoFin = false;
                    for (let j = i + 1; j < Math.min(i + 45, lineas.length); j++) {
                        const sigLinea = lineas[j];
                        // Detener la lectura si comienza otra sección mayor
                        if (/^\s*(?:Fuerza\s+ampliada|Colaboradores|Revisores|Agradecimientos|Derechos\s+de\s+autor|Confidencialidad|Fuente\s+de\s+financiación|ISBN|Contenido|Tabla\s+de|Resumen|Introducción|Metodología|Anexo)\b/i.test(sigLinea)) {
                            llegoFin = true;
                            break;
                        }
                        const item = parsearLineaAutor(sigLinea);
                        if (item) {
                            agregarAutor(item.name, item.role);
                        }
                    }

                    // Si la página terminó sin delimitador de fin de sección, revisar si la siguiente página continúa los autores
                    if (!llegoFin && paginas[num + 1]) {
                        const sigLineas = paginas[num + 1].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        for (const sig of sigLineas) {
                            if (/^\s*(?:Fuerza\s+ampliada|Colaboradores|Revisores|Agradecimientos|Derechos\s+de\s+autor|Confidencialidad|Fuente\s+de\s+financiación|ISBN|Contenido|Tabla\s+de|Resumen|Introducción|Metodología|Anexo)\b/i.test(sig)) {
                                break;
                            }
                            const item = parsearLineaAutor(sig);
                            if (item) {
                                agregarAutor(item.name, item.role);
                            }
                        }
                    }

                    if (autores.length > 0) {
                        return { autores, contactos };
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // REGLA 2: Mención inline 'Autores: Juan Pérez, María Gómez...' en cualquier página
        // ──────────────────────────────────────────────────────────────────────
        for (const [num, pText] of Object.entries(paginas)) {
            if (!pText) continue;
            const mInline = pText.match(/\b(?:Autores|Autor(?:es)?|Autora(?:s)?)\s*:\s*([^\r\n]+)/i);
            if (mInline && mInline[1].trim().length > 3) {
                const cands = mInline[1].trim().split(/[,;]|\s+y\s+|\s+e\s+/);
                for (let c of cands) {
                    const item = parsearLineaAutor(c);
                    if (item) agregarAutor(item.name, item.role);
                }
                if (autores.length > 0) {
                    console.log(`[IETS] 🎯 Identificados autores inline en página ${num}`);
                    return { autores, contactos };
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // REGLA 3: Si no dice 'Autores', buscar secciones técnicas alternativas
        // ('Grupo desarrollador', 'Lista de participantes', 'Equipo desarrollador')
        // ──────────────────────────────────────────────────────────────────────
        for (const [num, pText] of Object.entries(paginas)) {
            if (!pText) continue;
            const lineas = pText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i];
                if (/^\s*(?:Grupo\s+desarrollador(?:\s+de\s+la\s+gu[íi]a)?|Lista\s+de\s+participantes|Equipo\s+(?:desarrollador|t[eé]cnico|evaluador)|Equipo\s+UIS\s+de\s+revisión)\s*:?\s*$/i.test(linea)) {
                    console.log(`[IETS] 🎯 Identificada sección técnica alternativa en página ${num}: "${linea}"`);
                    for (let j = i + 1; j < Math.min(i + 35, lineas.length); j++) {
                        const sigLinea = lineas[j];
                        if (/^\s*(?:Revisores|Agradecimientos|Derechos|Confidencialidad|Fuente|ISBN|Contenido|Tabla|Resumen|Introducción|Metodología|Anexo)\b/i.test(sigLinea)) {
                            break;
                        }
                        const item = parsearLineaAutor(sigLinea);
                        if (item) {
                            agregarAutor(item.name, item.role);
                        }
                    }
                    if (autores.length > 0) {
                        return { autores, contactos };
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // REGLA 4: Portada con 'Elaborado por:' o 'Preparado por:'
        // ──────────────────────────────────────────────────────────────────────
        const p1 = paginas[1] || textoPag1 || "";
        const mPortada = p1.match(/\b(?:Elaborado\s+por|Preparado\s+por|Realizado\s+por)\s*:\s*([^\r\n]+)/i);
        if (mPortada && mPortada[1].trim().length > 3) {
            const cands = mPortada[1].trim().split(/[,;]|\s+y\s+|\s+e\s+/);
            for (let c of cands) {
                const item = parsearLineaAutor(c);
                if (item) agregarAutor(item.name, item.role);
            }
            if (autores.length > 0) return { autores, contactos };
        }

        if (autores.length > 0) return { autores, contactos };

        // Fallback institucional solo si no existe absolutamente ningún autor físico
        return {
            autores: ["Instituto de Evaluación Tecnológica en Salud (IETS)"],
            contactos: []
        };
    }

    function extraerMetodologia(textoTodo, paginasTexto) {
        const tocText = Object.values(paginasTexto || {}).slice(0, 15).join("\n") + "\n" + (textoTodo || "").slice(0, 30000);
        const tocLow = tocText.toLowerCase();
        const pasos = [];

        const fasesCatalogo = [
            {
                keywords: ["pregunta", "alcance", "pico", "objetivo"],
                title: "Formulación de la pregunta y alcance clínico",
                description: "Estructuración de preguntas de investigación en formato PICO (Población, Intervención, Comparación y Desenlaces) y concertación del alcance con el Ministerio de Salud y actores clave."
            },
            {
                keywords: ["búsqueda", "busqueda", "literatura", "fuentes de información", "bases de datos"],
                title: "Búsqueda sistemática de evidencia científica",
                description: "Búsqueda sistemática y exhaustiva en bases de datos biomédicas indexadas (PubMed/MEDLINE, Embase, Cochrane Library) y literatura gris para identificar la mejor evidencia disponible."
            },
            {
                keywords: ["tamización", "tamizacion", "selección", "seleccion", "criterios de inclusión", "elegibilidad"],
                title: "Tamización y selección de estudios",
                description: "Tamización independiente por pares evaluadores de títulos y resúmenes, seguida de revisión a texto completo según los criterios de elegibilidad e inclusión establecidos."
            },
            {
                keywords: ["extracción", "extraccion", "recolección de datos", "variables"],
                title: "Extracción de información clínica y desenlaces",
                description: "Extracción estandarizada en formatos predefinidos de características de la población, protocolos de intervención, tecnologías comparadoras y desenlaces críticos de efectividad y seguridad."
            },
            {
                keywords: ["riesgo de sesgo", "sesgos", "calidad metodológica", "amstar", "rob"],
                title: "Evaluación de calidad y riesgo de sesgos",
                description: "Evaluación crítica y metodológica del riesgo de sesgo en los estudios incluidos mediante instrumentos internacionales validados (RoB-2, ROBINS-I, AMSTAR-2)."
            },
            {
                keywords: ["certeza", "grade", "graduación", "fuerza de la evidencia"],
                title: "Graduación de la certeza de la evidencia (GRADE)",
                description: "Clasificación y graduación de la calidad y certeza del cuerpo de evidencia para cada desenlace clínico crítico utilizando el enfoque metodológico GRADE."
            },
            {
                keywords: ["síntesis", "sintesis", "metaanálisis", "metaanalisis", "red"],
                title: "Síntesis cuantitativa y cualitativa de evidencia",
                description: "Síntesis y análisis estadístico de los resultados clínicos de efectividad, seguridad y calidad de vida, incluyendo metaanálisis directo y en red cuando es aplicable."
            },
            {
                keywords: ["deliberación", "deliberacion", "panel", "consenso", "recomendación", "recomendacion"],
                title: "Deliberación, consenso técnico y recomendaciones",
                description: "Desarrollo de paneles multidisciplinarios de consenso con expertos clínicos, metodológicos y representantes de pacientes para deliberación y formulación de recomendaciones."
            }
        ];

        for (let fase of fasesCatalogo) {
            if (fase.keywords.some(k => tocLow.includes(k))) {
                pasos.push({ title: fase.title, description: fase.description });
            }
        }

        if (pasos.length < 3) {
            return [
                {
                    title: "Formulación de la pregunta y alcance clínico",
                    description: "Estructuración de la pregunta de investigación mediante el esquema PICO y definición del alcance técnico."
                },
                {
                    title: "Búsqueda sistemática y selección de evidencia",
                    description: "Búsqueda exhaustiva en bases de datos biomédicas y tamización de estudios clínicos relevantes."
                },
                {
                    title: "Evaluación de calidad metodológica y certeza GRADE",
                    description: "Evaluación del riesgo de sesgos y graduación de la certeza de la evidencia para los desenlaces evaluados."
                },
                {
                    title: "Deliberación técnica y recomendaciones",
                    description: "Formulación de recomendaciones informadas en la mejor evidencia científica disponible y deliberación técnica multidisciplinaria."
                }
            ];
        }

        return pasos;
    }

    function extraerTitulo(textoPag1, textoPortada) {
        // El título SIEMPRE se extrae de la portada (página 1).
        // NUNCA se extrae de bloques de citación secundaria ni de páginas internas.
        const textoBase = (textoPag1 && textoPag1.trim().length > 15) ? textoPag1 : (textoPortada || "");
        if (!textoBase) return "";

        const lineas = textoBase.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const ignorar = [
            "repositorio", "instituto", "instituci", "ministerio", "coordinación", "coordinacion",
            "subdirección", "subdireccion", "dirección", "direccion", "gerencia",
            "bogotá", "bogota", "colombia", "elaborado", "autores", "autor",
            "revisores", "revisor", "carpeta", "código", "codigo", "versión", "version",
            "entrega n", "documento informe", "informe final", "resumen ejecutivo",
            "tabla de", "contenido", "confidencialidad", "derechos de autor",
            "empresa", "nit", "representante", "cargo", "cédula", "cedula"
        ];
        const conectoresFinales = new Set([
            "y", "e", "o", "u", "de", "del", "para", "el", "la", "los", "las", "en", "con", "sin", "sobre", "a", "al", "por"
        ]);
        const prefijosFuertes = ["manual", "guía", "guia", "informe", "reporte", "protocolo", "lineamiento", "evaluación", "evaluacion", "posicionamiento", "apreciación", "apreciacion", "análisis", "analisis"];

        // 1. Filtrar líneas descartables
        const lineasLimpias = [];
        for (let l of lineas) {
            const low = l.toLowerCase();
            if (ignorar.some(ig => low.startsWith(ig))) continue;
            if (/^[\d\(\)"\-–—\.\s]+$/.test(l)) continue;
            if (/^(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{1,2}\s+de|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4})/i.test(low)) continue;
            lineasLimpias.push(l);
        }

        if (lineasLimpias.length === 0) return lineas[0] || "";

        // 2. Agrupar en bloques de títulos
        const bloques = [];
        let bloqueActual = [];

        for (let l of lineasLimpias) {
            const low = l.toLowerCase();
            const primerPalabra = low.split(/\s+/)[0] || "";
            let iniciaNuevo = false;

            if (bloqueActual.length > 0) {
                const ultimaLinea = bloqueActual[bloqueActual.length - 1];
                const palabrasUltima = ultimaLinea.toLowerCase().split(/\s+/);
                const ultimaPalabra = palabrasUltima[palabrasUltima.length - 1].replace(/[.,;:]+$/, "");

                // Si la línea anterior termina en conector (y, de, del, para, etc.), es continuación obligatoria
                if (conectoresFinales.has(ultimaPalabra)) {
                    iniciaNuevo = false;
                } else if (ultimaLinea.endsWith(".")) {
                    iniciaNuevo = true;
                } else if (prefijosFuertes.some(p => primerPalabra.startsWith(p)) && bloqueActual.join(" ").length >= 25) {
                    iniciaNuevo = true;
                }
            }

            if (iniciaNuevo) {
                bloques.push(bloqueActual.join(" ").replace(/\.+$/, "").trim());
                bloqueActual = [l];
            } else {
                bloqueActual.push(l);
            }
        }

        if (bloqueActual.length > 0) {
            bloques.push(bloqueActual.join(" ").replace(/\.+$/, "").trim());
        }

        const titulosValidos = bloques.filter(b => b.length >= 15);

        // Regla: El título SIEMPRE es el que aparece de primeras en la página 1 (portada)
        if (titulosValidos.length >= 1) {
            return titulosValidos[0].replace(/\s+/g, " ").trim();
        }

        return (lineasLimpias[0] || "").trim();
    }

    const MESES_MAP = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "setiembre": "09", "octubre": "10",
        "noviembre": "11", "diciembre": "12"
    };
    const MESES_REGEX_STR = Object.keys(MESES_MAP).join("|");

    function normalizarTextoParaFechas(texto) {
        if (!texto) return "";
        let t = texto.replace(/\s+/g, " ");
        // Reparar años con espacio interno ej: '202 4' -> '2024', '202 3' -> '2023', '202 5' -> '2025'
        t = t.replace(/\b(19\d|20\d)\s+(\d)\b/g, (m, g1, g2) => g1 + g2);
        t = t.replace(/\b(19|20)\s+(\d{2})\b/g, (m, g1, g2) => g1 + g2);
        // Reparar fechas con barras o guiones separados por espacios ej: '10 / 10 / 2025' -> '10/10/2025'
        t = t.replace(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})/g, (m, d, mes, a) => d + "/" + mes + "/" + a);
        // Reparar 'd e' -> 'de'
        t = t.replace(/\bd\s+e\b/gi, "de");
        return t;
    }

    function extraerFecha(textoPortada) {
        if (!textoPortada) return "2024-01-01";
        const t = normalizarTextoParaFechas(textoPortada);

        // 1. '19 de diciembre de 2024' o '30 de diciembre de 2024' o '11 de diciembre, 2025'
        const reg1 = new RegExp(`\\b([0-2]?\\d|3[01])\\s+de\\s+(${MESES_REGEX_STR})(?:[\\s,]+de|\\s*,)?\\s+(\\d{4})\\b`, "i");
        const m1 = t.match(reg1);
        if (m1) {
            const dia = String(parseInt(m1[1], 10)).padStart(2, "0");
            const mes = MESES_MAP[m1[2].toLowerCase()];
            const año = m1[3];
            return `${año}-${mes}-${dia}`;
        }

        // 2. 'Septiembre 4 de 2024' o 'Noviembre 21, 2024'
        const reg2 = new RegExp(`\\b(${MESES_REGEX_STR})\\s+([0-2]?\\d|3[01])(?:[\\s,]+de|\\s*,)?\\s+(\\d{4})\\b`, "i");
        const m2 = t.match(reg2);
        if (m2) {
            const mes = MESES_MAP[m2[1].toLowerCase()];
            const dia = String(parseInt(m2[2], 10)).padStart(2, "0");
            const año = m2[3];
            return `${año}-${mes}-${dia}`;
        }

        // 3. Formato numérico DD/MM/YYYY o DD-MM-YYYY (ej: 10/10/2025)
        const m3 = t.match(/\b([0-2]?\d|3[01])[\/\-]([0-1]?\d)[\/\-](\d{4})\b/);
        if (m3) {
            const dia = String(parseInt(m3[1], 10)).padStart(2, "0");
            const mes = String(parseInt(m3[2], 10)).padStart(2, "0");
            const año = m3[3];
            return `${año}-${mes}-${dia}`;
        }

        // 4. 'Diciembre de 2024' o 'Diciembre 2024'
        const reg4 = new RegExp(`\\b(${MESES_REGEX_STR})\\s+(?:de\\s+)?(\\d{4})\\b`, "i");
        const m4 = t.match(reg4);
        if (m4) {
            const mes = MESES_MAP[m4[1].toLowerCase()];
            const año = m4[2];
            return `${año}-${mes}-01`;
        }

        // 5. Año suelto
        const m5 = t.match(/\b(20\d{2}|19\d{2})\b/);
        if (m5) {
            return `${m5[1]}-01-01`;
        }

        return "";
    }

    function extraerTipoDocumento(textoPortada) {
        const low = textoPortada.toLowerCase();
        if (low.includes("posicionamiento terapéutico") || low.includes("evaluación de tecnología") || low.includes("evaluacion de tecnologia")) {
            return "Evaluación de Tecnología";
        }
        if (low.includes("guía de práctica clínica") || low.includes("guia de practica clinica") || low.includes("gpc")) {
            return "Guía de Práctica Clínica";
        }
        if (low.includes("revisión sistemática") || low.includes("revision sistematica")) {
            return "Revisión Sistemática";
        }
        if (low.includes("reporte de evidencia") || low.includes("síntesis rápida")) {
            return "Reporte de Evidencia";
        }
        return "Informe Técnico";
    }

    function extraerAreaTematica(titulo, textoPortada) {
        const comb = (titulo + " " + textoPortada).toLowerCase();
        if (comb.includes("diabetes") || comb.includes("metformina") || comb.includes("insulina") || comb.includes("endocrin")) return "Endocrinología";
        if (comb.includes("cáncer") || comb.includes("cancer") || comb.includes("oncol") || comb.includes("tumor")) return "Oncología";
        if (comb.includes("cardio") || comb.includes("hipertens") || comb.includes("infarto")) return "Cardiovascular";
        if (comb.includes("respirator") || comb.includes("pulmon") || comb.includes("asma") || comb.includes("epoc")) return "Neumología";
        if (comb.includes("reorganización") || comb.includes("nomenclatura") || comb.includes("repositorio") || comb.includes("archivo")) return "Gestión en Salud";
        return "Gestión en Salud";
    }

    function extraerTecnologia(titulo, textoPag1) {
        const comb = (titulo + " " + textoPag1).toLowerCase();
        if (comb.includes("diabetes")) return "Tratamientos farmacológicos para diabetes mellitus tipo 2";
        if (comb.includes("trastuzumab")) return "Trastuzumab";
        if (comb.includes("metformina")) return "Metformina";
        if (comb.includes("nomenclatura") || comb.includes("repositorio")) return "Metodología de Gestión Documental y Nomenclatura";
        return "Tecnologías y Procedimientos en Salud";
    }

    function extraerResumen(textoCompleto) {
        const m = textoCompleto.match(/(?:^|\n)\s*(?:resumen\s+ejecutivo|resumen|abstract)[:\s\n]+([^.\n]{15,}[\s\S]+?)(?=\n\s*(?:[1-9]\.|\b[A-ZÁÉÍÓÚÑ]{6,}\n)|\Z)/i);
        if (m && !m[1].slice(0, 150).includes("....") && m[1].trim().length > 80) {
            return m[1].replace(/\s+/g, " ").trim().slice(0, 1200);
        }
        const mIntro = textoCompleto.match(/(?:^|\n)\s*(?:1\.\s*introducción|introducción)[:\s\n]+([^.\n]{15,}[\s\S]+?)(?=\n\s*(?:2\.|\b[A-ZÁÉÍÓÚÑ]{6,}\n)|\Z)/i);
        if (mIntro && !mIntro[1].slice(0, 150).includes("....") && mIntro[1].trim().length > 80) {
            return mIntro[1].replace(/\s+/g, " ").trim().slice(0, 1200);
        }
        return "El presente informe técnico-científico elaborado por el Instituto de Evaluación Tecnológica en Salud (IETS) consolida el desarrollo metodológico, evaluación de evidencia científica y recomendaciones aplicadas para el sector salud.";
    }

    function extraerCitacionOficial(textoPortada) {
        const m = textoPortada.match(/(?:Este documento debe citarse[^\n]*|Citaci[oó]n[^\n]*)\n([\s\S]+?)(?:\n(?:Derechos|Confidencialidad|ISBN|Fuente|\Z))/i);
        if (m) {
            return m[1].replace(/\s+/g, " ").trim();
        }
        return "";
    }

    function generarCitas(autores, titulo, año, doi, citacionOficial) {
        const doiLink = doi ? ` https://doi.org/${doi}` : "";
        const doiVan = doi ? ` DOI: ${doi}` : "";
        const añoStr = String(año || "2024").substring(0, 4);

        const autoresApa = [];
        const autoresVan = [];
        const autoresFiltrados = (autores || []).filter(a => !esAutorExcluido(a));
        for (let a of autoresFiltrados) {
            if (/instituto|ministerio|iets/i.test(a)) {
                autoresApa.push(a);
                autoresVan.push(a);
                continue;
            }
            const partes = a.split(",");
            let ap = "", nom = "";
            if (partes.length > 1) {
                ap = partes[0].trim();
                nom = partes[1].trim();
            } else {
                const sub = a.trim().split(/\s+/);
                if (sub.length >= 2) {
                    ap = sub[sub.length - 1];
                    nom = sub.slice(0, -1).join(" ");
                } else {
                    ap = a;
                }
            }
            const inits = nom ? nom.split(/\s+/).map(p => p[0] ? p[0] + "." : "").join(" ") : "";
            autoresApa.push(inits ? `${ap}, ${inits}` : ap);
            autoresVan.push(inits ? `${ap} ${inits.replace(/\./g, "")}` : ap);
        }

        let strApa = "";
        if (autoresApa.length > 1) {
            strApa = autoresApa.slice(0, -1).join(", ") + ", & " + autoresApa[autoresApa.length - 1];
        } else if (autoresApa.length === 1) {
            strApa = autoresApa[0];
        } else {
            strApa = "Instituto de Evaluación Tecnológica en Salud (IETS)";
        }

        const strVan = autoresVan.length > 0 ? autoresVan.join(", ") : "Instituto de Evaluación Tecnológica en Salud (IETS)";

        const apa = `${strApa} (${añoStr}). ${titulo}. Instituto de Evaluación Tecnológica en Salud (IETS).${doiLink}`;
        let vancouver;
        if (citacionOficial && !esAutorExcluido(citacionOficial) && titulo && citacionOficial.toLowerCase().includes(titulo.toLowerCase().slice(0, 15))) {
            vancouver = citacionOficial;
        } else {
            vancouver = `${strVan}. ${titulo}. Bogotá: Instituto de Evaluación Tecnológica en Salud (IETS); ${añoStr}.${doiVan}`;
        }

        return { apa, vancouver };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ASIGNACIÓN DE VALORES COMPATIBLE CON REACT
    // ──────────────────────────────────────────────────────────────────────────
    function setReactVal(el, value) {
        if (!el || value === undefined || value === null) return false;
        try {
            el.focus();
            if (el._valueTracker) {
                el._valueTracker.setValue("");
            }
            const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            const desc = Object.getOwnPropertyDescriptor(proto, "value");
            if (desc && desc.set) {
                desc.set.call(el, String(value));
            } else {
                el.value = String(value);
            }
            el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
            el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
            el.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

            // Forzar notificación directa a React 18
            const reactKey = Object.keys(el).find(k => k.startsWith("__reactProps$"));
            if (reactKey && el[reactKey] && typeof el[reactKey].onChange === "function") {
                try {
                    el[reactKey].onChange({ target: el, currentTarget: el });
                } catch (rErr) {}
            }
            return true;
        } catch (e) {
            console.warn("Error en setReactVal:", e);
            return false;
        }
    }

    function setReactSelect(el, targetText, fallbacks = []) {
        if (!el || !el.options) return false;
        try {
            el.focus();
            const search = (targetText || "").toLowerCase().trim();
            const opts = Array.from(el.options);
            let val = null;

            if (search) {
                for (let o of opts) {
                    const txt = (o.text || "").toLowerCase();
                    const v = (o.value || "").toLowerCase();
                    if (txt.includes(search) || v.includes(search)) {
                        val = o.value;
                        break;
                    }
                }
            }

            if (!val && fallbacks.length > 0) {
                for (let fb of fallbacks) {
                    const fbStr = String(fb).toLowerCase();
                    for (let o of opts) {
                        if ((o.text || "").toLowerCase().includes(fbStr)) {
                            val = o.value;
                            break;
                        }
                    }
                    if (val) break;
                }
            }

            if (!val) {
                for (let o of opts) {
                    const txt = (o.text || "").toLowerCase();
                    if (o.value && !txt.includes("seleccione") && !txt.includes("choose")) {
                        val = o.value;
                        break;
                    }
                }
            }

            if (val !== null) {
                const proto = window.HTMLSelectElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, "value");
                if (desc && desc.set) {
                    desc.set.call(el, val);
                } else {
                    el.value = val;
                }
                el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
                el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                el.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));
                return true;
            }
        } catch (e) {
            console.warn("Error en setReactSelect:", e);
        }
        return false;
    }

    async function addReactTags(inputEl, items) {
        if (!inputEl || !items) return;
        const list = Array.isArray(items) ? items : [items];
        for (let item of list) {
            const val = String(item).trim();
            if (!val || esAutorExcluido(val)) continue;

            inputEl.focus();
            setReactVal(inputEl, val);
            await new Promise(r => setTimeout(r, 60));

            const enterEvt = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
            inputEl.dispatchEvent(new KeyboardEvent("keydown", enterEvt));
            inputEl.dispatchEvent(new KeyboardEvent("keypress", enterEvt));
            inputEl.dispatchEvent(new KeyboardEvent("keyup", enterEvt));
            await new Promise(r => setTimeout(r, 80));
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LIMPIEZA DE AUTORES EXCLUIDOS EN EL DOM (Garantía Visual y de Estado React)
    // ──────────────────────────────────────────────────────────────────────────
    async function limpiarAutoresExcluidosDelDom() {
        try {
            // 1. Limpiar tags/chips de autores en formData.authors
            const badges = Array.from(document.querySelectorAll("span.rounded-full, div.flex.flex-wrap span"));
            for (const badge of badges) {
                const text = (badge.innerText || badge.textContent || "").trim();
                if (esAutorExcluido(text)) {
                    const btnClose = badge.querySelector("button");
                    if (btnClose) {
                        console.log("[IETS] 🗑️ Removiendo autor excluido de la interfaz:", text);
                        btnClose.click();
                        await new Promise(r => setTimeout(r, 60));
                    }
                }
            }

            // 2. Limpiar tarjetas de contacto de autor en formData.authorContacts
            const contactCards = Array.from(document.querySelectorAll("div.bg-gray-50.rounded, div[class*='p-3'][class*='rounded']"));
            for (const card of contactCards) {
                const nameInp = card.querySelector("input[placeholder='Nombre']");
                const cardText = nameInp ? nameInp.value : (card.innerText || card.textContent || "");
                if (cardText && esAutorExcluido(cardText)) {
                    const btnDelete = card.querySelector("button");
                    if (btnDelete) {
                        console.log("[IETS] 🗑️ Removiendo contacto de autor excluido de la interfaz:", cardText);
                        btnDelete.click();
                        await new Promise(r => setTimeout(r, 60));
                    }
                }
            }
        } catch (err) {
            console.warn("[IETS] Advertencia en limpiarAutoresExcluidosDelDom:", err);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // INTEGRACIÓN CON MINIMAX M2.5 AI
    // API compatible con OpenAI: https://api.minimax.io/v1/chat/completions
    // ──────────────────────────────────────────────────────────────────────────

    // Clave API de MiniMax (plan Token/Coding, prefijo sk-cp-)
    // Se guarda en chrome.storage.local y se puede cambiar desde la barra de la extensión
    const MINIMAX_API_KEY_DEFAULT = "sk-cp-bYiSKlzBxcIgjRN5FqpB93wEM8_MeUqNyNwf8eilazLXjL5-hfcikdKPRieYzp65Cy6yAu66Wb80QahNX0ow__6FvUbHTR7VIDs26m5IvJVBIvnbZL8bC3c";
    const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";
    const MINIMAX_MODEL   = "MiniMax-M2.5";

    async function getApiKey() {
        return new Promise((resolve) => {
            try {
                chrome.storage.local.get(["iets_minimax_api_key"], (result) => {
                    resolve(result.iets_minimax_api_key || MINIMAX_API_KEY_DEFAULT);
                });
            } catch (e) {
                resolve(MINIMAX_API_KEY_DEFAULT);
            }
        });
    }

    async function saveApiKey(key) {
        return new Promise((resolve) => {
            try {
                chrome.storage.local.set({ iets_minimax_api_key: key }, resolve);
            } catch (e) { resolve(); }
        });
    }

    /**
     * Llama a MiniMax M2.5 con el texto del PDF y obtiene un JSON con todos los campos.
     * MiniMax usa formato compatible con OpenAI (chat/completions + Bearer token).
     */
    async function extraerConMiniMax(textoPdf, nombreArchivo, textoPag1, textoPag2) {
        const apiKey = await getApiKey();
        if (!apiKey) throw new Error("API key de MiniMax no configurada.");

        // Enviar contenido preliminar completo (primeras páginas donde están título, autores y metodología)
        const textoPortadaCorto = (textoPag1 || "").slice(0, 3000);
        const textoCompletoDoc  = (textoPdf || "").slice(0, 15000);

        const systemPrompt = `Eres un asistente especializado en extracción de metadatos de documentos científicos del Instituto de Evaluación Tecnológica en Salud (IETS) de Colombia. Tu tarea es analizar texto extraído de PDFs y devolver ÚNICAMENTE un JSON válido sin ningún texto adicional, sin markdown, sin explicaciones.
REGLA INSTITUCIONAL OBLIGATORIA: NUNCA incluyas bajo ninguna circunstancia como autores ni en contactos a directivas institucionales del IETS como Adriana María Robayo García o Luz Mery Barragán González. Únicamente debes extraer a investigadores, líderes temáticos y equipo técnico.`;

        const userPrompt = `Analiza el siguiente texto extraído del PDF "${nombreArchivo}" y devuelve ÚNICAMENTE el siguiente JSON válido (sin markdown, sin texto adicional, solo el objeto JSON):

{
  "titulo": "Título completo del documento",
  "tipo_documento": "Uno de: Evaluación de Tecnología | Guía de Práctica Clínica | Revisión Sistemática | Reporte de Evidencia | Informe Técnico | Protocolo",
  "idioma": "Español",
  "area_tematica": "Área clínica o temática principal (ej: Oncología, Cardiovascular, Gestión en Salud, Endocrinología, etc.)",
  "tecnologia": "Nombre de la tecnología, intervención o tema central evaluado",
  "resumen_ejecutivo": "Resumen del documento de máximo 1200 caracteres",
  "fecha_publicacion": "Fecha exacta en formato YYYY-MM-DD (ej: 2024-12-19 o 2024-12-01 si solo se indica mes y año)",
  "nivel_acceso": "Público (Acceso Abierto)",
  "is_peer_reviewed": true,
  "is_recommended": true,
  "paginas": 0,
  "doi": "",
  "etiquetas": ["etiqueta1", "etiqueta2", "etiqueta3"],
  "autores": ["Nombre Completo Autor1", "Nombre Completo Autor2"],
  "contactos_autores": [
    {"name": "Nombre Completo", "role": "Cargo o rol", "email": ""}
  ],
  "metodologia": [
    {"title": "Nombre del paso metodológico", "description": "Descripción breve del paso"}
  ],
  "recomendaciones": [
    {"title": "Título recomendación", "strength": "Fuerte o Débil", "evidence": "Alta, Moderada o Baja", "description": "Descripción de la recomendación"}
  ],
  "citas_apa": "Cita en formato APA completa",
  "citas_vancouver": "Cita en formato Vancouver completa",
  "url_archivo": "/files/${nombreArchivo}"
}

INSTRUCCIONES CRÍTICAS:
- TÍTULO: Debe ser EXCLUSIVAMENTE el título principal que aparece en la PÁGINA 1 (PORTADA). NUNCA uses títulos de citas bibliográficas, ni de la sección "Citación", ni de otras páginas. El título original del documento SIEMPRE está en la portada primera página.
- AUTORES: Busca en TODO el documento el encabezado o bloque que dice explícitamente "Autores" (o "Autor:", "Autores:", "Autores y colaboradores", "Equipo desarrollador"). Extrae ÚNICAMENTE los nombres de las personas listadas bajo esa sección de Autores. NUNCA asumas que los autores están en la página 2 (en la página 2 suele estar el directorio institucional con ministros y directores, NO los autores técnicos). El campo "autores" debe ser una lista de nombres completos. El campo "contactos_autores" debe incluir cada autor con su nombre y cargo/rol.

- EXCLUSIÓN ESTRICTA Y OBLIGATORIA DE AUTORES:
  * NUNCA incluyas bajo ninguna circunstancia como autores, contactos ni en citas bibliográficas a:
    1. "Adriana María Robayo García" (ni cualquier variante como Adriana Robayo, Robayo García, etc.)
    2. "Luz Mery Barragán González" (ni cualquier variante como Luz Mery Barragán, Luz Mery, Barragán González, etc.)
  * Corresponden a la Dirección y Subdirección institucional del IETS, NO son autoras técnicas de la investigación.
- FECHA DE PUBLICACIÓN: Búscala en la PORTADA (Página 1) en formato YYYY-MM-DD.
- RESUMEN: Usa el "Resumen Ejecutivo" o "Introducción" del documento.
- METODOLOGÍA: Extrae los pasos reales del documento, pero NO incluyas pasos de análisis económico, costo-efectividad ni costos.
- ANÁLISIS ECONÓMICO: NO extraigas métricas, costos ni secciones de evaluación económica.
- Si un campo no se encuentra, usa valor vacío "" o razonable.
- SOLO devuelve el JSON. Nada más.

===PORTADA DEL DOCUMENTO (PÁGINA 1)===
${textoPortadaCorto}
===FIN PORTADA===

===CONTENIDO DEL DOCUMENTO (Busca la sección que dice "Autores", metodología, resumen, etc.)===
${textoCompletoDoc}
===FIN DEL DOCUMENTO===`;

        const response = await fetch(MINIMAX_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MINIMAX_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user",   content: userPrompt   }
                ],
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Error API MiniMax (${response.status}): ${errBody.slice(0, 300)}`);
        }

        const resultado = await response.json();

        // Formato OpenAI: choices[0].message.content
        const textoRespuesta = resultado.choices?.[0]?.message?.content || "";
        if (!textoRespuesta) throw new Error("MiniMax devolvió respuesta vacía.");

        // Limpiar y extraer el JSON (puede venir con ```json...``` o directo)
        const mJson = textoRespuesta.match(/```(?:json)?\s*([\s\S]+?)```/);
        const jsonStr = mJson ? mJson[1].trim() : textoRespuesta.trim();
        return JSON.parse(jsonStr);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PROCESAMIENTO Y DILIGENCIAMIENTO COMPLETO
    // ──────────────────────────────────────────────────────────────────────────
    async function procesarYAutollenar(file, statusEl) {
        try {
            statusEl.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> <strong>Leyendo PDF:</strong> ${file.name}...`;

            const texto = await extraerTextoPdf(file);

            // ── MODO IA: Claude extrae todos los campos automáticamente ─────────
            let data = null;
            let modoIA = false;
            try {
                statusEl.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">🤖</span> <strong>MiniMax M2.5 está analizando el PDF...</strong> (puede tomar 5-15 segundos)`;
                data = await extraerConMiniMax(texto.todo, file.name, texto.pag1, texto.pag2);
                modoIA = true;
                console.log("[IETS] ✅ Extracción con MiniMax M2.5 exitosa:", data);
            } catch (claudeErr) {
                console.warn("[IETS] MiniMax falló, usando extracción heurística:", claudeErr.message);
                statusEl.innerHTML = `<span>⏳</span> <strong>Extrayendo metadatos (modo heurístico)...</strong>`;
            }

            // ── MODO FALLBACK: extracción heurística si Claude falla ────────────
            let titulo, autores, contactos, metodologia, fecha, tipoDoc, area, tecnologia, resumen, citas, etiquetas;

            // ── FECHA DE PUBLICACIÓN: SIEMPRE se extrae de la Primera Página (Portada)
            const fechaPag1 = extraerFecha(texto.pag1);
            const fechaDoc  = fechaPag1 || extraerFecha(texto.pag2) || extraerFecha(texto.portada);

            // ── TÍTULO DEL DOCUMENTO: SIEMPRE se extrae de la Primera Página (Portada)
            const tituloPag1 = extraerTitulo(texto.pag1);

            if (modoIA && data) {
                // TÍTULO: La portada (página 1) es la regla suprema. NUNCA se sobreescribe con citas ni alucinaciones
                titulo       = (tituloPag1 && tituloPag1.length >= 8) ? tituloPag1 : (data.titulo || extraerTitulo(texto.portada) || "");
                autores      = (data.autores && data.autores.length > 0) ? data.autores : extraerAutoresYContactos(texto.pag1, texto.pag2, texto.paginasTexto).autores;
                contactos    = (data.contactos_autores && data.contactos_autores.length > 0) ? data.contactos_autores : extraerAutoresYContactos(texto.pag1, texto.pag2, texto.paginasTexto).contactos;

                // Filtrar explícitamente directivas excluidas (Dra Luz Mery, Adriana Robayo, etc.)
                autores      = (autores || []).filter(a => !esAutorExcluido(a));
                contactos    = (contactos || []).filter(c => !esAutorExcluido(c && c.name ? c.name : ""));

                if (autores.length === 0) {
                    const fallbackAC = extraerAutoresYContactos(texto.pag1, texto.pag2, texto.paginasTexto);
                    autores   = fallbackAC.autores.filter(a => !esAutorExcluido(a));
                    contactos = fallbackAC.contactos.filter(c => !esAutorExcluido(c && c.name ? c.name : ""));
                    if (autores.length === 0) {
                        autores = ["Instituto de Evaluación Tecnológica en Salud (IETS)"];
                    }
                }

                metodologia  = data.metodologia || [];
                // Prioridad absoluta a la fecha real de la Página 1 (o Página 2 si pág 1 no tiene fecha)
                fecha        = fechaPag1 || (data.fecha_publicacion && !/^\d{4}$/.test(String(data.fecha_publicacion).trim()) ? data.fecha_publicacion : (fechaDoc || "2024-01-01"));
                if (/^\d{4}$/.test(String(fecha).trim())) {
                    fecha = String(fecha).trim() + "-01-01";
                }
                tipoDoc      = data.tipo_documento || "Informe Técnico";
                area         = data.area_tematica || "Gestión en Salud";
                tecnologia   = data.tecnologia || "";
                resumen      = data.resumen_ejecutivo || "";
                etiquetas    = data.etiquetas || [];

                // Validar que las citas contengan el título real y NO contengan autores excluidos
                const citReal = generarCitas(autores, titulo, fecha, "", "");
                const apaTieneExcluido = esAutorExcluido(data.citas_apa || "");
                const vanTieneExcluido = esAutorExcluido(data.citas_vancouver || "");
                citas        = {
                    apa: (data.citas_apa && !apaTieneExcluido && data.citas_apa.toLowerCase().includes(titulo.toLowerCase().slice(0, 15))) ? data.citas_apa : citReal.apa,
                    vancouver: (data.citas_vancouver && !vanTieneExcluido && data.citas_vancouver.toLowerCase().includes(titulo.toLowerCase().slice(0, 15))) ? data.citas_vancouver : citReal.vancouver
                };
            } else {
                titulo       = (tituloPag1 && tituloPag1.length >= 8) ? tituloPag1 : extraerTitulo(texto.portada);
                const ac     = extraerAutoresYContactos(texto.pag1, texto.pag2, texto.paginasTexto);
                autores      = ac.autores.filter(a => !esAutorExcluido(a));
                contactos    = ac.contactos.filter(c => !esAutorExcluido(c && c.name ? c.name : ""));
                if (autores.length === 0) {
                    autores = ["Instituto de Evaluación Tecnológica en Salud (IETS)"];
                }
                metodologia  = extraerMetodologia(texto.todo, texto.paginasTexto);
                fecha        = fechaPag1 || fechaDoc || "2024-01-01";
                tipoDoc      = extraerTipoDocumento(texto.portada);
                area         = extraerAreaTematica(titulo, texto.portada);
                tecnologia   = extraerTecnologia(titulo, texto.pag1);
                resumen      = extraerResumen(texto.todo);
                const citOf  = extraerCitacionOficial(texto.portada);
                citas        = generarCitas(autores, titulo, fecha, "", citOf);
                etiquetas    = ["Gestión en Salud", "Acceso a la salud"];
                if (area === "Endocrinología") etiquetas.unshift("Diabetes Mellitus");
                if (tipoDoc.includes("Posicionamiento")) etiquetas.unshift("Posicionamiento Terapéutico");
            }

            // Limpieza gramatical (reparar 'd e' -> 'de', 'd el' -> 'del', espacios antes de puntos, etc.)
            titulo = limpiarTextoGramatical(titulo);
            resumen = limpiarTextoGramatical(resumen);
            tecnologia = limpiarTextoGramatical(tecnologia);

            // ── DILIGENCIAR EL FORMULARIO ────────────────────────────────────────
            statusEl.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;">✍️</span> <strong>Diligenciando formulario...</strong>`;

            // Diligenciar en el DOM con selectores exactos de UploadDocument.tsx
            const allSelects = Array.from(document.querySelectorAll("select"));
            const allTextareas = Array.from(document.querySelectorAll("textarea"));

            // 1. Título
            const tituloInp = document.querySelector('input[name="title"]') ||
                              document.querySelector("input:not([type='date']):not([placeholder*='Trastuzumab']):not([placeholder*='Escriba']):not([placeholder*='45']):not([placeholder*='10.'])") ||
                              document.querySelectorAll("input")[0];
            setReactVal(tituloInp, titulo);

            // 2. Tipo de documento
            const tipoSelect = document.querySelector('select[name="type"]') || allSelects[0];
            setReactSelect(tipoSelect, tipoDoc, ["evaluación", "informe", "guía"]);

            // 3. Idioma
            const idiomaSelect = document.querySelector('select[name="language"]') || allSelects[1];
            setReactSelect(idiomaSelect, "Español", ["español", "spanish"]);

            // 4. Área temática
            const areaSelect = document.querySelector('select[name="area"]') || allSelects[2];
            setReactSelect(areaSelect, area, ["endocrinología", "gestión", "salud", "tecnología", "oncología"]);

            // 5. Tecnología
            const tecInp = document.querySelector('input[name="technology"]') ||
                           document.querySelector("input[placeholder*='Trastuzumab']");
            setReactVal(tecInp, tecnologia);

            // 6. Resumen Ejecutivo
            const abstractInp = document.querySelector('textarea[name="abstract"]') || allTextareas[0];
            setReactVal(abstractInp, resumen);

            // 7. Autores (Lista simple)
            // Paso preventivo: Limpiar cualquier autor excluido que ya pudiera existir en el formulario
            await limpiarAutoresExcluidosDelDom();

            const autoresInp = document.querySelector("input[placeholder*='Escriba un nombre']") ||
                               document.querySelector("input[placeholder*='presione Enter']");
            const autoresFiltradosFinales = (autores || []).filter(a => !esAutorExcluido(a));
            if (autoresInp && autoresFiltradosFinales.length > 0) {
                await addReactTags(autoresInp, autoresFiltradosFinales);
            }

            // Segunda pasada de verificación inmediata en el DOM
            await limpiarAutoresExcluidosDelDom();

            // 8. Metodología (Agregar cada paso detectado del PDF)
            const btnAgregarPaso = Array.from(document.querySelectorAll("button")).find(
                b => b.innerText && b.innerText.includes("Agregar Paso")
            );
            if (btnAgregarPaso && metodologia.length > 0) {
                for (let i = 0; i < metodologia.length; i++) {
                    const paso = metodologia[i];
                    btnAgregarPaso.click();
                    await new Promise(r => setTimeout(r, 70));

                    const titleInputs = document.querySelectorAll("input[placeholder*='Título del paso'], input[placeholder*='paso']");
                    const descTextareas = document.querySelectorAll("textarea[placeholder*='Descripción de la metodología'], textarea[placeholder*='metodología']");

                    if (titleInputs.length > i) setReactVal(titleInputs[i], paso.title);
                    if (descTextareas.length > i) setReactVal(descTextareas[i], paso.description);
                    await new Promise(r => setTimeout(r, 40));
                }
            }

            // 9. Recomendaciones dinámicas según la tecnología evaluada (sin fallbacks ajenos)
            const btnAgregarRec = Array.from(document.querySelectorAll("button")).find(
                b => b.innerText && b.innerText.includes("Agregar Recomendación")
            );
            const tecnologiaVal = String(tecnologia || titulo || "la tecnología sanitaria").trim();
            const recomendaciones = [
                {
                    title: `Recomendación técnica sobre ${tecnologiaVal.substring(0, 50)}`,
                    strength: "Fuerte",
                    evidence: "Moderada",
                    description: `Se recomienda la aplicación asistencial y técnica de ${tecnologiaVal} conforme a la síntesis de evidencia y criterios de efectividad evaluados por el IETS.`
                }
            ];
            if (btnAgregarRec && recomendaciones.length > 0) {
                for (let i = 0; i < recomendaciones.length; i++) {
                    const rec = recomendaciones[i];
                    btnAgregarRec.click();
                    await new Promise(r => setTimeout(r, 70));

                    const titleInputs = document.querySelectorAll("input[placeholder*='Título de la recomendación']");
                    const descTextareas = document.querySelectorAll("textarea[placeholder*='Descripción detallada']");
                    const recSelects = Array.from(document.querySelectorAll("select")).filter(
                        s => !["type", "language", "area", "accessLevel"].includes(s.name)
                    );

                    if (titleInputs.length > i) setReactVal(titleInputs[i], rec.title);
                    if (descTextareas.length > i) setReactVal(descTextareas[i], rec.description);

                    if (recSelects.length >= (i + 1) * 2) {
                        setReactSelect(recSelects[i * 2], rec.strength, ["fuerte", "alta"]);
                        setReactSelect(recSelects[i * 2 + 1], rec.evidence, ["alta", "moderada"]);
                    }
                    await new Promise(r => setTimeout(r, 40));
                }
            }

            // 10. ANÁLISIS ECONÓMICO: Intencionalmente omitido (no llenar este espacio)
            try {
                const ecoHeadings = Array.from(document.querySelectorAll("h3, h4")).filter(
                    h => h.innerText && h.innerText.toLowerCase().includes("económico")
                );
                for (const h of ecoHeadings) {
                    const card = h.closest(".rounded-xl") || h.parentElement;
                    if (card) {
                        const deleteBtns = card.querySelectorAll("button svg.lucide-trash-2, button[aria-label*='eliminar'], button[title*='eliminar']");
                        for (const db of deleteBtns) {
                            const btn = db.closest("button");
                            if (btn) btn.click();
                        }
                    }
                }
            } catch (e) { /* silencioso */ }

            // 11. Fecha de Publicación (en el bloque de Configuración)
            let fechaInp = document.querySelector('input[name="publicationDate"]');
            if (!fechaInp) {
                const configHeadings = Array.from(document.querySelectorAll("h3, h4, h2")).filter(
                    h => h.innerText && h.innerText.toLowerCase().includes("configuración")
                );
                for (const ch of configHeadings) {
                    const card = ch.closest(".rounded-xl") || ch.parentElement;
                    if (card) {
                        const inp = card.querySelector("input[type='date'], input");
                        if (inp) { fechaInp = inp; break; }
                    }
                }
            }
            if (!fechaInp) {
                fechaInp = document.querySelector("input[type='date']");
            }
            if (fechaInp) {
                let f = String(fecha).trim();
                if (/^\d{4}$/.test(f)) f = f + "-01-01";
                setReactVal(fechaInp, f);
                console.log("[IETS] ✅ Fecha de publicación (Página 1) diligenciada en Configuración:", f);
            }

            // 12. Nivel de Acceso
            const accesoSelect = document.querySelector('select[name="accessLevel"]') || allSelects[3];
            setReactSelect(accesoSelect, "Abierto", ["público", "abierto"]);

            // 13. Checkboxes (Revisión por Pares y Recomendado)
            const chkPeer = document.querySelector('input[name="isPeerReviewed"]');
            if (chkPeer && !chkPeer.checked) chkPeer.click();

            const chkRec = document.querySelector('input[name="isRecommended"]');
            if (chkRec && !chkRec.checked) chkRec.click();

            // 14. Páginas
            const paginasInp = document.querySelector('input[name="pages"]') ||
                               document.querySelector("input[placeholder*='45']");
            setReactVal(paginasInp, texto.totalPaginas);

            // 15. DOI
            const doiInp = document.querySelector('input[name="doi"]') ||
                           document.querySelector("input[placeholder*='10.1000']");
            if (doiInp) setReactVal(doiInp, "");

            // 16. Etiquetas
            const etiqInp = document.querySelector("input[placeholder*='Agregar etiqueta']") ||
                            document.querySelector("input[placeholder*='etiqueta']");
            if (etiqInp) {
                await addReactTags(etiqInp, etiquetas);
            }

            // 17. Contacto Autores
            const h3Contacto = Array.from(document.querySelectorAll("h3")).find(h => h.innerText && h.innerText.includes("Contacto Autores"));
            const contactosFiltradosFinales = (contactos || []).filter(c => c && c.name && !esAutorExcluido(c.name));
            if (h3Contacto && contactosFiltradosFinales.length > 0) {
                const cardHeader = h3Contacto.closest("div") ? h3Contacto.closest("div").parentElement : null;
                const btnAddContact = cardHeader ? cardHeader.querySelector("button") : null;
                if (btnAddContact) {
                    for (let i = 0; i < contactosFiltradosFinales.length; i++) {
                        const cont = contactosFiltradosFinales[i];
                        if (!cont || !cont.name || esAutorExcluido(cont.name)) continue;
                        btnAddContact.click();
                        await new Promise(r => setTimeout(r, 70));

                        const nameInps = document.querySelectorAll("input[placeholder='Nombre completo'], input[placeholder='Nombre']");
                        const roleInps = document.querySelectorAll("input[placeholder='Rol / Cargo'], input[placeholder='Rol/Cargo']");
                        const emailInps = document.querySelectorAll("input[placeholder='Correo institucional'], input[placeholder='Email']");

                        if (nameInps.length > i) setReactVal(nameInps[i], cont.name);
                        if (roleInps.length > i) setReactVal(roleInps[i], cont.role || "Autor principal");
                        if (emailInps.length > i) setReactVal(emailInps[i], cont.email || "contacto@iets.org.co");
                        await new Promise(r => setTimeout(r, 40));
                    }
                }
            }

            // Tercera pasada de limpieza en el DOM para asegurar limpieza de contactos y autores
            await limpiarAutoresExcluidosDelDom();

            // Helper seguro para buscar campos sin riesgo de colisión con metodología
            function findTextareaByNameOrLabel(name, labelText) {
                let el = document.querySelector(`textarea[name="${name}"]`);
                if (el) return el;
                const labels = Array.from(document.querySelectorAll("label"));
                const lbl = labels.find(l => l.textContent && l.textContent.toLowerCase().includes(labelText.toLowerCase()));
                if (lbl) {
                    const parent = lbl.closest("div") || lbl.parentElement;
                    if (parent) {
                        const ta = parent.querySelector("textarea");
                        if (ta) return ta;
                    }
                }
                return null;
            }

            // 18. Citas APA (Nunca usar índices genéricos para no sobreescribir la metodología)
            const apaTextarea = findTextareaByNameOrLabel("citationAPA", "Formato APA");
            if (apaTextarea) {
                let valApa = citas.apa || "";
                if (esAutorExcluido(valApa)) {
                    valApa = citReal.apa;
                }
                setReactVal(apaTextarea, valApa);
            }

            // 19. Citas Vancouver
            const vanTextarea = findTextareaByNameOrLabel("citationVancouver", "Formato Vancouver");
            if (vanTextarea) {
                let valVan = citas.vancouver || "";
                if (esAutorExcluido(valVan)) {
                    valVan = citReal.vancouver;
                }
                setReactVal(vanTextarea, valVan);
            }

            // 20. URL del Archivo Principal
            const urlArchivoInp = document.querySelector('input[name="fileUrl"]') ||
                                  document.querySelector("input[placeholder*='documento.pdf']");
            if (urlArchivoInp) setReactVal(urlArchivoInp, `/files/${file.name}`);

            // 21. Adjuntar archivo al input de archivo del formulario si existe
            const fileInp = document.querySelector("input[type='file']:not(#iets-file-input)");
            if (fileInp) {
                try {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInp.files = dt.files;
                    fileInp.dispatchEvent(new Event("change", { bubbles: true }));
                } catch (e) {}
            }

            // Notificación exitosa
            const modoLabel = modoIA
                ? `<span style="background:#7c3aed;color:#fff;font-size:11px;padding:2px 7px;border-radius:99px;margin-left:6px;">🤖 MiniMax M2.5</span>`
                : `<span style="background:#f59e0b;color:#fff;font-size:11px;padding:2px 7px;border-radius:99px;margin-left:6px;">⚙️ Heurístico</span>`;

            statusEl.innerHTML = `
                <div style="background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;padding:12px 16px;border-radius:8px;font-size:13px;line-height:1.5;">
                    <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span>✅ ¡Formulario Diligenciado con Éxito!</span>${modoLabel}
                    </div>
                    <div><strong>Título:</strong> ${titulo.slice(0, 80)}...</div>
                    <div><strong>Autores (${autores.length}):</strong> ${autores.join(", ")}</div>
                    <div><strong>Metodología (${metodologia.length} pasos agregados):</strong> ${metodologia.map(m => m.title).slice(0, 3).join(", ")}...</div>
                    <div><strong>Tipo:</strong> ${tipoDoc} | <strong>Fecha:</strong> ${fecha} | <strong>Páginas:</strong> ${texto.totalPaginas}</div>
                </div>
            `;
        } catch (err) {
            console.error("Error al autollenar PDF:", err);
            statusEl.innerHTML = `<span style="color:#dc2626;">❌ Error al leer el PDF: ${err.message}</span>`;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // INYECCIÓN DE LA INTERFAZ EN LA PÁGINA WEB (Ultra Ligera y Sin Lag)
    // ──────────────────────────────────────────────────────────────────────────
    // Detectar si la página actual es una ruta de carga/registro de documentos
    function esRutaDeSubida() {
        const pathname = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        // Rutas típicas del repositorio IETS
        if (pathname.includes("/admin/upload")) return true;
        if (pathname.includes("/upload")) return true;
        if (pathname.includes("/admin/new")) return true;
        if (pathname.includes("/admin/crear")) return true;
        if (pathname.includes("/admin/documento")) return true;
        if (pathname.includes("/documento/nuevo")) return true;
        if (pathname.includes("/registro")) return true;
        if (search.includes("upload") || search.includes("nuevo") || search.includes("crear")) return true;
        // Detectar presencia de formulario con campo title (indicador genérico de formulario de subida)
        const inputTitle = document.querySelector('input[name="title"]');
        const fileInput = document.querySelector('input[type="file"]');
        if (inputTitle && fileInput) return true;
        return false;
    }

    function inyectarBarraAutollenado() {
        // Solo actuar si estamos en la ruta de subida de documentos
        if (!esRutaDeSubida()) return;
        if (document.getElementById("iets-autofill-banner")) return;

        // Búsqueda directa sin iterar divs ni provocar reflows continuos
        const inputTitle = document.querySelector('input[name="title"]');
        const h1 = document.querySelector("h1");
        if (!inputTitle && !h1) return;

        const infoCard = inputTitle ? inputTitle.closest("div.bg-white") : null;
        const targetNode = infoCard || (h1 ? h1.closest("main") || h1.parentElement : document.body);
        if (!targetNode || !targetNode.parentNode) return;

        const banner = document.createElement("div");
        banner.id = "iets-autofill-banner";
        banner.style.cssText = `
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px dashed #0284c7;
            border-radius: 14px;
            padding: 18px 22px;
            margin: 16px 0 24px 0;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.1);
            font-family: system-ui, -apple-system, sans-serif;
            transition: all 0.2s ease;
            position: relative;
        `;

        banner.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="background:linear-gradient(135deg,#7c3aed,#0284c7);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">🤖</div>
                    <div>
                        <h3 style="margin:0;font-size:16px;font-weight:700;color:#0369a1;">Autollenador con IA — IETS <span style="background:#7c3aed;color:#fff;font-size:10px;padding:1px 6px;border-radius:99px;vertical-align:middle;">MiniMax M2.5</span></h3>
                        <p style="margin:0;font-size:12px;color:#0284c7;">Arrastra un PDF y MiniMax M2.5 extraerá automáticamente título, autores, metodología y todos los campos</p>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="iets-config-key-btn" title="Configurar API Key de Claude" style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px;">⚙️ API Key</button>
                    <label style="background:linear-gradient(135deg,#7c3aed,#0284c7);color:#ffffff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(124,58,237,0.3);transition:background 0.2s;">
                        <span>📂 Seleccionar PDF</span>
                        <input type="file" id="iets-file-input" accept=".pdf" style="display:none;" />
                    </label>
                </div>
            </div>
            <div id="iets-api-key-panel" style="display:none;background:#faf5ff;border:1px solid #ddd6fe;border-radius:8px;padding:10px 14px;margin-bottom:10px;">
                <label style="font-size:12px;color:#6d28d9;font-weight:600;">🔑 Clave API de Claude (Anthropic):</label>
                <div style="display:flex;gap:8px;margin-top:6px;">
                    <input id="iets-api-key-input" type="password" placeholder="sk-ant-..." style="flex:1;border:1px solid #c4b5fd;border-radius:6px;padding:6px 10px;font-size:12px;font-family:monospace;" />
                    <button id="iets-api-key-save" style="background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;font-weight:600;">Guardar</button>
                </div>
                <p style="margin:4px 0 0;font-size:11px;color:#7c3aed;">La clave se guarda localmente en tu navegador y nunca se comparte.</p>
            </div>
            <div id="iets-dropzone-box" style="border:1px dashed #a78bfa;background:rgba(245,243,255,0.7);padding:14px;border-radius:8px;text-align:center;cursor:pointer;">
                <p id="iets-status-text" style="margin:0;color:#0369a1;font-size:14px;font-weight:500;">
                    📥 <strong>Suelta aquí tu archivo PDF</strong> — MiniMax M2.5 lo analizará con IA automáticamente
                </p>
            </div>
        `;

        const dropzone = banner.querySelector("#iets-dropzone-box");
        const statusText = banner.querySelector("#iets-status-text");
        const fileInput = banner.querySelector("#iets-file-input");
        const configBtn = banner.querySelector("#iets-config-key-btn");
        const apiKeyPanel = banner.querySelector("#iets-api-key-panel");
        const apiKeyInput = banner.querySelector("#iets-api-key-input");
        const apiKeySaveBtn = banner.querySelector("#iets-api-key-save");

        // Botón ⚙️ API Key: mostrar/ocultar panel
        configBtn.addEventListener("click", async () => {
            const isVisible = apiKeyPanel.style.display !== "none";
            apiKeyPanel.style.display = isVisible ? "none" : "block";
            if (!isVisible) {
                // Cargar la clave actual (ofuscada) en el input
                const currentKey = await getApiKey();
                apiKeyInput.value = currentKey || "";
                apiKeyInput.focus();
            }
        });

        // Guardar nueva API Key
        apiKeySaveBtn.addEventListener("click", async () => {
            const newKey = apiKeyInput.value.trim();
            if (!newKey) { alert("Por favor ingresa una clave API válida."); return; }
            await saveApiKey(newKey);
            apiKeyPanel.style.display = "none";
            apiKeyInput.value = "";
            statusText.innerHTML = `<span style="color:#7c3aed;">✅ <strong>Clave API de Claude guardada correctamente.</strong> Arrastra un PDF para empezar.</span>`;
        });

        // Drag & Drop visuales
        ["dragenter", "dragover"].forEach(eventName => {
            banner.addEventListener(eventName, (e) => {
                e.preventDefault();
                banner.style.background = "#ede9fe";
                banner.style.borderColor = "#7c3aed";
                banner.style.transform = "scale(1.005)";
            });
        });

        ["dragleave", "drop"].forEach(eventName => {
            banner.addEventListener(eventName, (e) => {
                e.preventDefault();
                banner.style.background = "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";
                banner.style.borderColor = "#0284c7";
                banner.style.transform = "scale(1)";
            });
        });

        banner.addEventListener("drop", (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files && files.length > 0 && files[0].name.toLowerCase().endsWith(".pdf")) {
                procesarYAutollenar(files[0], statusText);
            } else {
                alert("Por favor arrastra un archivo en formato PDF.");
            }
        });

        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                procesarYAutollenar(e.target.files[0], statusText);
            }
        });

        dropzone.addEventListener("click", () => fileInput.click());

        // Insertar en la página antes de la tarjeta de información general
        targetNode.parentNode.insertBefore(banner, targetNode);
        console.log("✓ Barra de autollenado IETS con Claude AI inyectada exitosamente.");
    }

    // ============================================================================
    // PANEL FLOTANTE DE SANEAMIENTO MASIVO IETS (2011-2026) - VERSIÓN 3.0
    // ============================================================================
    let manifestData = null;

    async function obtenerManifest() {
        if (manifestData) return manifestData;
        try {
            const url = chrome.runtime.getURL("patch_manifest.json");
            const res = await fetch(url);
            manifestData = await res.json();
            return manifestData;
        } catch (e) {
            console.error("[Saneamiento] Error cargando patch_manifest.json:", e);
            return null;
        }
    }

    function resolverAuthToken() {
        let token = sessionStorage.getItem("temp_token") || "";
        if (!token) {
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith("firebase:authUser:")) {
                        const parsed = JSON.parse(localStorage.getItem(k));
                        if (parsed && parsed.stsTokenManager && parsed.stsTokenManager.accessToken) {
                            token = parsed.stsTokenManager.accessToken;
                            break;
                        }
                    }
                }
            } catch (e) {}
        }
        return token;
    }

    function inyectarPanelSaneamientoMasivo() {
        if (document.getElementById("iets-saneamiento-pill")) return;

        // Botón Píldora Flotante
        const pill = document.createElement("button");
        pill.id = "iets-saneamiento-pill";
        pill.innerHTML = `🛡️ <strong>Saneamiento Masivo IETS (3.0)</strong>`;
        pill.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            background: linear-gradient(135deg, #17252A 0%, #2B7A78 100%);
            color: #ffffff;
            border: 2px solid #3AAFA9;
            border-radius: 9999px;
            padding: 12px 22px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        pill.addEventListener("mouseenter", () => pill.style.transform = "translateY(-2px) scale(1.02)");
        pill.addEventListener("mouseleave", () => pill.style.transform = "translateY(0) scale(1)");

        // Panel Principal
        const panel = document.createElement("div");
        panel.id = "iets-saneamiento-panel";
        panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 24px;
            width: 520px;
            max-width: calc(100vw - 48px);
            max-height: 85vh;
            background: #ffffff;
            border: 2px solid #2B7A78;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.35);
            z-index: 999999;
            display: none;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #17252A;
            overflow: hidden;
        `;

        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #17252A 0%, #2B7A78 100%); color: #fff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        🛡️ Saneamiento Masivo IETS (2011–2026)
                    </h3>
                    <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.9; color: #DEF2F1;">
                        Estandarización de Autores, Deduplicación y Limpieza de Taxonomías
                    </p>
                </div>
                <button id="iets-panel-close" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
            </div>

            <div style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
                <!-- Token de Autenticación -->
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px;">
                    <label style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; display: block; margin-bottom: 4px;">
                        Token de Administrador (Bearer)
                    </label>
                    <input type="password" id="iets-token-input" placeholder="Bearer Token (detectado automáticamente)" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; font-family: monospace;">
                    <div id="iets-token-status" style="font-size: 11px; color: #059669; margin-top: 4px; font-weight: 600;">Detectando sesión...</div>
                </div>

                <!-- Resumen del Manifiesto -->
                <div id="iets-manifest-summary" style="background: #DEF2F1; border: 1px solid #3AAFA9; border-radius: 10px; padding: 12px; font-size: 12px;">
                    Cargando patch_manifest.json...
                </div>

                <!-- Botones de Acción (Pasos 0 a 4) -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="iets-btn-paso0" style="background: #0284C7; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <span>💾 Paso 0: Descargar Backup JSON & Verificar API</span>
                        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px;">Seguridad</span>
                    </button>

                    <button id="iets-btn-paso1" style="background: #2B7A78; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <span>🏷️ Paso 1: Aplicar Taxonomías Limpias (/api/settings)</span>
                        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px;">14 tipos / 36 áreas</span>
                    </button>

                    <button id="iets-btn-paso2" style="background: #17252A; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <span>✨ Paso 2: Estandarizar Metadatos y Autores (303 Docs)</span>
                        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px;">PATCH</span>
                    </button>

                    <button id="iets-btn-paso3" style="background: #DC2626; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <span>🗑️ Paso 3: Depurar 53 Registros Duplicados / Demos</span>
                        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px;">DELETE</span>
                    </button>

                    <button id="iets-btn-paso4" style="background: #F59E0B; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <span>📄 Paso 4: Ver 42 PDFs Pendientes de Carga Manual</span>
                        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px;">Auditoría</span>
                    </button>
                </div>

                <!-- Barra de Progreso -->
                <div id="iets-progress-wrap" style="display: none; background: #E2E8F0; border-radius: 9999px; height: 10px; overflow: hidden;">
                    <div id="iets-progress-bar" style="background: #2B7A78; height: 100%; width: 0%; transition: width 0.2s ease;"></div>
                </div>

                <!-- Tabla de PDFs Pendientes (Paso 4) -->
                <div id="iets-manual-table-wrap" style="display: none; max-height: 200px; overflow-y: auto; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 11px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #F1F5F9; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 6px; text-align: left; border-bottom: 1px solid #CBD5E1;">Año</th>
                                <th style="padding: 6px; text-align: left; border-bottom: 1px solid #CBD5E1;">Título</th>
                                <th style="padding: 6px; text-align: center; border-bottom: 1px solid #CBD5E1;">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="iets-manual-table-body"></tbody>
                    </table>
                </div>

                <!-- Consola / Log en Vivo -->
                <div id="iets-live-log" style="background: #0F172A; color: #38BDF8; font-family: monospace; font-size: 11px; padding: 10px; border-radius: 8px; height: 120px; overflow-y: auto; white-space: pre-wrap; line-height: 1.4;">
[Sistema] Inicializando panel de Saneamiento Masivo...
                </div>
            </div>
        `;

        document.body.appendChild(pill);
        document.body.appendChild(panel);

        const logEl = panel.querySelector("#iets-live-log");
        function appendLog(msg, color) {
            const time = new Date().toLocaleTimeString();
            const span = document.createElement("div");
            span.style.color = color || "#38BDF8";
            span.textContent = `[${time}] ${msg}`;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Toggle visibility
        pill.addEventListener("click", async () => {
            if (panel.style.display === "none" || !panel.style.display) {
                panel.style.display = "flex";
                // Inicializar datos y token
                const token = resolverAuthToken();
                const tokenInp = panel.querySelector("#iets-token-input");
                const tokenStatus = panel.querySelector("#iets-token-status");
                if (token) {
                    tokenInp.value = token;
                    tokenStatus.textContent = "✅ Sesión activa detectada (Token cargado)";
                    tokenStatus.style.color = "#059669";
                } else {
                    tokenStatus.textContent = "⚠️ No se detectó sesión. Pega tu Bearer Token.";
                    tokenStatus.style.color = "#D97706";
                }

                const m = await obtenerManifest();
                const summaryEl = panel.querySelector("#iets-manifest-summary");
                if (m) {
                    summaryEl.innerHTML = `
                        <strong>Manifiesto v${m.version} cargado exitosamente:</strong><br>
                        • Total documentos: <strong>${m.stats.totalDocuments}</strong><br>
                        • Para estandarizar (Keep): <strong>${m.stats.keepCount}</strong><br>
                        • Para eliminar (Trash): <strong>${m.stats.trashCount}</strong><br>
                        • Requieren PDF manual: <strong>${m.stats.manualPdfCount}</strong>
                    `;
                    appendLog(`Manifiesto v${m.version} cargado: ${m.stats.keepCount} Keep, ${m.stats.trashCount} Trash.`, "#34D399");
                } else {
                    summaryEl.textContent = "❌ Error al cargar patch_manifest.json de la extensión.";
                    appendLog("Error al cargar patch_manifest.json", "#F87171");
                }
            } else {
                panel.style.display = "none";
            }
        });

        panel.querySelector("#iets-panel-close").addEventListener("click", () => {
            panel.style.display = "none";
        });

        const API_BASE = "https://back-repositorioiets.onrender.com/api";

        function getEffectiveToken() {
            return panel.querySelector("#iets-token-input").value.trim() || resolverAuthToken();
        }

        // Helper para headers
        function authHeaders() {
            const t = getEffectiveToken();
            return {
                "Authorization": `Bearer ${t}`,
                "Content-Type": "application/json"
            };
        }

        // Paso 0: Descargar Backup JSON & Preflight
        panel.querySelector("#iets-btn-paso0").addEventListener("click", async () => {
            appendLog("Iniciando Paso 0: Exportación de Backup y Preflight...", "#60A5FA");
            const token = getEffectiveToken();
            if (!token) {
                alert("Por favor ingresa un Bearer Token válido antes de continuar.");
                return;
            }
            try {
                appendLog("Consultando API /documents?limit=1000...", "#94A3B8");
                const res = await fetch(`${API_BASE}/documents?limit=1000`, { headers: { "Authorization": `Bearer ${token}` } });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                const data = await res.json();
                const docsList = data.documents || data || [];

                // Disparar descarga local de archivo JSON
                const blob = new Blob([JSON.stringify(docsList, null, 2)], { type: "application/json" });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `backup_repositorio_iets_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);

                appendLog(`✅ Backup exportado exitosamente (${docsList.length} documentos descargados).`, "#34D399");

                // Test Preflight
                appendLog("Probando preflight sobre documento 1790886641397...", "#94A3B8");
                const testDoc = await fetch(`${API_BASE}/documents/1790886641397`, { headers: { "Authorization": `Bearer ${token}` } });
                if (testDoc.ok) {
                    appendLog("✅ Conexión con Render API verificada. Preflight exitoso.", "#34D399");
                } else {
                    appendLog(`⚠️ Preflight detail HTTP ${testDoc.status}`, "#FBBF24");
                }
            } catch (err) {
                appendLog(`❌ Error en Paso 0: ${err.message}`, "#F87171");
            }
        });

        // Paso 1: Aplicar Taxonomías
        panel.querySelector("#iets-btn-paso1").addEventListener("click", async () => {
            appendLog("Iniciando Paso 1: Actualización de taxonomías en /api/settings...", "#60A5FA");
            const m = await obtenerManifest();
            if (!m || !m.settingsPatch) {
                alert("No se encontró settingsPatch en el manifiesto.");
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/settings`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(m.settingsPatch)
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                appendLog("✅ Taxonomías actualizadas exitosamente en el backend.", "#34D399");
            } catch (err) {
                appendLog(`❌ Error en Paso 1: ${err.message}`, "#F87171");
            }
        });

        // Paso 2: Estandarizar 303 Documentos
        panel.querySelector("#iets-btn-paso2").addEventListener("click", async () => {
            const m = await obtenerManifest();
            if (!m || !m.keepPatches) return;
            const patches = m.keepPatches;

            if (!confirm(`¿Iniciar la estandarización masiva de ${patches.length} documentos en el repositorio institucional?`)) {
                return;
            }

            appendLog(`Iniciando Paso 2: Estandarización de ${patches.length} documentos...`, "#60A5FA");
            const progWrap = panel.querySelector("#iets-progress-wrap");
            const progBar = panel.querySelector("#iets-progress-bar");
            progWrap.style.display = "block";
            progBar.style.width = "0%";

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < patches.length; i++) {
                const p = patches[i];
                try {
                    const res = await fetch(`${API_BASE}/documents/${p.id}`, {
                        method: "PATCH",
                        headers: authHeaders(),
                        body: JSON.stringify(p)
                    });
                    if (res.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        appendLog(`⚠️ Doc ${p.id} falló HTTP ${res.status}`, "#FBBF24");
                    }
                } catch (e) {
                    errorCount++;
                    appendLog(`❌ Error enviando doc ${p.id}: ${e.message}`, "#F87171");
                }

                const pct = Math.round(((i + 1) / patches.length) * 100);
                progBar.style.width = `${pct}%`;

                if ((i + 1) % 25 === 0 || i === patches.length - 1) {
                    appendLog(`Progreso: ${i + 1}/${patches.length} (${pct}%) • Éxitos: ${successCount}, Errores: ${errorCount}`, "#94A3B8");
                }
                await new Promise(r => setTimeout(r, 60)); // pequeño respiro para evitar rate limit
            }

            // Limpiar caché de sesión de la aplicación web
            try {
                sessionStorage.removeItem("admin_documents_cache");
                sessionStorage.removeItem("admin_deleted_docs_cache");
            } catch (e) {}

            appendLog(`🏁 Paso 2 completado: ${successCount} actualizados, ${errorCount} errores. Caché limpiado.`, "#34D399");
        });

        // Paso 3: Depurar 53 Registros Duplicados / Demos
        panel.querySelector("#iets-btn-paso3").addEventListener("click", async () => {
            const m = await obtenerManifest();
            if (!m || !m.trashCandidates) return;
            const trash = m.trashCandidates;

            if (!confirm(`⚠️ ATENCIÓN: ¿Confirmas la eliminación segura de los ${trash.length} registros duplicados/sintéticos identificados?`)) {
                return;
            }

            appendLog(`Iniciando Paso 3: Eliminación de ${trash.length} documentos...`, "#EF4444");
            let delCount = 0;
            let errCount = 0;

            for (let i = 0; i < trash.length; i++) {
                const t = trash[i];
                try {
                    const res = await fetch(`${API_BASE}/documents/${t.id}`, {
                        method: "DELETE",
                        headers: authHeaders()
                    });
                    if (res.ok) {
                        delCount++;
                        appendLog(`Eliminado [${t.id}]: ${t.reason}`, "#FCA5A5");
                    } else {
                        errCount++;
                        appendLog(`⚠️ No se pudo eliminar ${t.id} (HTTP ${res.status})`, "#FBBF24");
                    }
                } catch (e) {
                    errCount++;
                    appendLog(`❌ Error eliminando ${t.id}: ${e.message}`, "#F87171");
                }
                await new Promise(r => setTimeout(r, 60));
            }

            try {
                sessionStorage.removeItem("admin_documents_cache");
                sessionStorage.removeItem("admin_deleted_docs_cache");
            } catch (e) {}

            appendLog(`🏁 Paso 3 completado: ${delCount} eliminados, ${errCount} errores. Caché limpiado.`, "#34D399");
        });

        // Paso 4: Ver 42 PDFs Pendientes
        panel.querySelector("#iets-btn-paso4").addEventListener("click", async () => {
            const m = await obtenerManifest();
            if (!m || !m.manualPdfNeeded) return;
            const tableWrap = panel.querySelector("#iets-manual-table-wrap");
            const tbody = panel.querySelector("#iets-manual-table-body");

            if (tableWrap.style.display === "none") {
                tbody.innerHTML = "";
                m.manualPdfNeeded.forEach(item => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #E2E8F0";
                    tr.innerHTML = `
                        <td style="padding: 6px; font-weight: 600;">${item.year}</td>
                        <td style="padding: 6px;">${item.title}</td>
                        <td style="padding: 6px; text-align: center;">
                            <a href="${item.suggestedEditUrl}" target="_blank" style="color: #0284C7; text-decoration: underline; font-weight: 600;">Cargar</a>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                tableWrap.style.display = "block";
                appendLog(`Mostrando tabla de ${m.manualPdfNeeded.length} documentos que requieren PDF.`, "#FBBF24");
            } else {
                tableWrap.style.display = "none";
            }
        });
    }

    // Insertar el panel de saneamiento en rutas de administración
    function monitorearRutaAdmin() {
        if (window.location.pathname.startsWith("/admin") || window.location.pathname.includes("admin")) {
            inyectarPanelSaneamientoMasivo();
        }
    }

    setInterval(monitorearRutaAdmin, 1500);
    monitorearRutaAdmin();
})();
