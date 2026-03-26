import os

def generate_folio_icon(output_path="icon.svg"):
    # Colores definidos en tu DEVELOPMENT_PLAN.md
    accent_color = "#525252"
    surface_white = "#FFFFFF"
    
    # SVG de 1024x1024 para máxima compatibilidad con generadores de assets
    svg_content = f"""<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" rx="220" fill="{accent_color}"/>
    
    <path d="M320 250V774H704V442L512 250H320Z" fill="{surface_white}" fill-opacity="0.9"/>
    
    <path d="M512 250V442H704L512 250Z" fill="{surface_white}"/>
    <path d="M512 442L704 442L512 250V442Z" fill="black" fill-opacity="0.1"/>
    
    <rect x="400" y="560" width="224" height="24" rx="12" fill="{accent_color}" fill-opacity="0.5"/>
    <rect x="400" y="630" width="224" height="24" rx="12" fill="{accent_color}" fill-opacity="0.5"/>
    <rect x="400" y="490" width="120" height="24" rx="12" fill="{accent_color}" fill-opacity="0.5"/>
</svg>
"""

    try:
        with open(output_path, "w") as f:
            f.write(svg_content)
        print(f"✨ Icono de Folio generado con éxito en: {os.path.abspath(output_path)}")
    except Exception as e:
        print(f"❌ Error al generar el archivo: {e}")

if __name__ == "__main__":
    generate_folio_icon()