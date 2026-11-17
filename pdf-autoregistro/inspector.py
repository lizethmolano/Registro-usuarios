"""
inspector.py
============
Script de inspeccion: abre el navegador, navega al formulario de carga
del Repositorio IETS y extrae automaticamente todos los campos del
formulario (ids, names, tipos, opciones de select, etc.).

Guarda los resultados en: selectores_iets.json

Uso:
    python inspector.py

El navegador se abrira en modo VISIBLE para que puedas iniciar sesion
manualmente si la plataforma lo requiere.
"""

import sys
import io
# Forzar salida UTF-8 en Windows para evitar UnicodeEncodeError
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

URL = "https://repositorio.iets.org.co/admin/upload"
OUTPUT = "selectores_iets.json"

# ─── Script JS que extrae todos los campos del formulario ─────────────────────
JS_EXTRACTOR = """
() => {
    const campos = [];

    // Inputs y textareas
    document.querySelectorAll('input, textarea').forEach(el => {
        if (el.type === 'hidden') return;
        const label = (() => {
            // Buscar label asociado
            if (el.id) {
                const lbl = document.querySelector(`label[for="${el.id}"]`);
                if (lbl) return lbl.innerText.trim();
            }
            // Label padre
            const parentLabel = el.closest('label');
            if (parentLabel) return parentLabel.innerText.trim();
            // Placeholder
            if (el.placeholder) return el.placeholder;
            // Texto del contenedor cercano
            const container = el.closest('div, section, fieldset');
            if (container) {
                const textNode = container.querySelector('label, span, p, legend, h1, h2, h3, h4');
                if (textNode) return textNode.innerText.trim();
            }
            return '';
        })();

        campos.push({
            tipo: el.tagName.toLowerCase() + (el.type ? `[type=${el.type}]` : ''),
            id: el.id || null,
            name: el.name || null,
            placeholder: el.placeholder || null,
            clase: el.className || null,
            label: label,
            selector_recomendado: el.id ? `#${el.id}` : (el.name ? `[name="${el.name}"]` : null),
            valor_actual: el.value || null,
        });
    });

    // Selects
    document.querySelectorAll('select').forEach(el => {
        const opciones = Array.from(el.options).map(o => ({
            valor: o.value,
            texto: o.text.trim(),
        }));
        const label = (() => {
            if (el.id) {
                const lbl = document.querySelector(`label[for="${el.id}"]`);
                if (lbl) return lbl.innerText.trim();
            }
            return el.name || '';
        })();
        campos.push({
            tipo: 'select',
            id: el.id || null,
            name: el.name || null,
            label: label,
            selector_recomendado: el.id ? `#${el.id}` : (el.name ? `select[name="${el.name}"]` : null),
            opciones: opciones,
        });
    });

    // Botones
    const botones = [];
    document.querySelectorAll('button, input[type=submit], input[type=button]').forEach(el => {
        botones.push({
            tipo: el.tagName.toLowerCase(),
            texto: el.innerText?.trim() || el.value || '',
            id: el.id || null,
            clase: el.className || null,
            selector: el.id ? `#${el.id}` : `button:has-text("${el.innerText?.trim() || ''}")`,
        });
    });

    return { campos, botones, url: window.location.href, titulo: document.title };
}
"""


async def inspeccionar():
    print(f"\\n{'='*60}")
    print("  INSPECTOR - Repositorio IETS")
    print(f"{'='*60}")
    print(f"Abriendo: {URL}\\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--start-maximized"],
        )
        context = await browser.new_context(
            viewport={"width": 1400, "height": 900},
            locale="es-CO",
        )
        page = await context.new_page()

        print("Navegando a la plataforma...")
        await page.goto(URL, wait_until="domcontentloaded", timeout=30000)

        # Esperar a que React monte el contenido
        print("Esperando que la SPA cargue (5 segundos)...")
        await page.wait_for_timeout(5000)

        print("\\n" + "-"*60)
        print("Si la plataforma requiere LOGIN, inicia sesion ahora.")
        print("Cuando el FORMULARIO DE CARGA este visible en el navegador,")
        print("regresa aqui y presiona ENTER para continuar.")
        print("-"*60 + "\\n")
        input(">>> Presiona ENTER cuando el formulario este listo: ")

        # Navegar al formulario de carga (por si se quedo en otra pagina)
        current_url = page.url
        print(f"URL actual: {current_url}")
        if "upload" not in current_url:
            print("Navegando al formulario de carga...")
            await page.goto(URL, wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)

        print("\\nExtrayendo campos del formulario...")
        resultado = await page.evaluate(JS_EXTRACTOR)

        # Screenshot
        screenshot_path = "screenshot_formulario_iets.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot guardado: {screenshot_path}")

        await browser.close()

    # Guardar resultados
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    # Mostrar resumen en consola
    print(f"\\n{'='*60}")
    print(f"  CAMPOS ENCONTRADOS: {len(resultado['campos'])}")
    print(f"  BOTONES ENCONTRADOS: {len(resultado['botones'])}")
    print(f"{'='*60}")

    for campo in resultado["campos"]:
        print(f"\\n  [{campo['tipo']}]")
        print(f"    Label    : {campo.get('label', '')}")
        print(f"    id       : {campo.get('id', '-')}")
        print(f"    name     : {campo.get('name', '-')}")
        print(f"    Selector : {campo.get('selector_recomendado', '-')}")
        if campo.get("opciones"):
            print(f"    Opciones : {[o['texto'] for o in campo['opciones'][:10]]}")

    print(f"\\n{'='*60}")
    print(f"  Resultados completos guardados en: {OUTPUT}")
    print(f"{'='*60}\\n")

    return resultado


if __name__ == "__main__":
    asyncio.run(inspeccionar())

