#!/bin/bash

# Play Store Assets Creation Helper
# Dieses Script hilft beim Erstellen der Play Store Grafiken

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎨 Play Store Assets Creator"
echo "============================"
echo ""

# Farben für Terminal-Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion: Feature Graphic öffnen
open_feature_graphic() {
    echo -e "${BLUE}📊 Öffne Feature Graphic HTML...${NC}"

    if [[ -f "feature-graphic.html" ]]; then
        # Öffne im Standard-Browser
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "feature-graphic.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "feature-graphic.html"
        else
            echo "Öffne feature-graphic.html manuell in deinem Browser"
        fi

        echo ""
        echo -e "${GREEN}✅ Feature Graphic geöffnet!${NC}"
        echo ""
        echo "📝 Nächste Schritte:"
        echo "1. Warte bis die Seite vollständig geladen ist"
        echo "2. Öffne Browser DevTools (F12)"
        echo "3. Rechtsklick auf das SVG-Element"
        echo "4. Wähle 'Screenshot des Knotens aufnehmen'"
        echo "5. Speichere als 'feature-graphic.png' in diesem Ordner"
        echo ""
        echo "Alternative: Verwende die Browser-Screenshot-Funktion (Cmd+Shift+P in Chrome)"
        echo ""
    else
        echo -e "${YELLOW}⚠️  feature-graphic.html nicht gefunden!${NC}"
    fi
}

# Funktion: Screenshot Helper öffnen (EMPFOHLEN)
open_screenshot_helper() {
    echo -e "${BLUE}📱 Öffne Screenshot Helper...${NC}"

    if [[ -f "screenshot-helper.html" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "screenshot-helper.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "screenshot-helper.html"
        else
            echo "Öffne screenshot-helper.html manuell in deinem Browser"
        fi

        echo ""
        echo -e "${GREEN}✅ Screenshot Helper geöffnet!${NC}"
        echo ""
        echo "📝 Nächste Schritte:"
        echo "1. Wähle ein Gerät (z.B. iPhone 12 Pro)"
        echo "2. Warte bis App geladen ist"
        echo "3. Öffne DevTools (F12)"
        echo "4. Rechtsklick auf Device Frame → 'Element untersuchen'"
        echo "5. Im Elements-Tab: Rechtsklick auf <div class=\"device-frame\"> Element"
        echo "6. 'Screenshot des Knotens aufnehmen'"
        echo "7. Als PNG speichern"
        echo ""
        echo -e "${GREEN}💡 Vorteil:${NC} Perfekte Mobile-Darstellung ohne DevTools-Probleme!"
        echo ""
    else
        echo -e "${YELLOW}⚠️  screenshot-helper.html nicht gefunden!${NC}"
    fi
}

# Funktion: Web-App direkt öffnen (Alternative)
open_webapp() {
    echo -e "${BLUE}🌐 Öffne Web-App direkt...${NC}"

    # Deployed Version öffnen
    DEPLOYED_URL="https://s540d.github.io/Energy_Price_Germany/"

    echo "Öffne deployed App: $DEPLOYED_URL"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$DEPLOYED_URL"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$DEPLOYED_URL"
    else
        echo "Öffne $DEPLOYED_URL manuell in deinem Browser"
    fi

    echo ""
    echo -e "${GREEN}✅ Web-App geöffnet!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Hinweis: Chrome DevTools haben oft Probleme mit der Breite!${NC}"
    echo "Nutze stattdessen: ./create-assets.sh screenshots"
    echo ""
}

# Funktion: Status überprüfen
check_status() {
    echo -e "${BLUE}📋 Status der Play Store Assets${NC}"
    echo ""

    # Icon
    if [[ -f "icon-512x512.png" ]]; then
        SIZE=$(du -h "icon-512x512.png" | cut -f1)
        echo -e "${GREEN}✅ App-Icon (512x512):${NC} icon-512x512.png ($SIZE)"
    else
        echo -e "${YELLOW}❌ App-Icon (512x512): Fehlt!${NC}"
    fi

    # Feature Graphic
    if [[ -f "feature-graphic.png" ]]; then
        SIZE=$(du -h "feature-graphic.png" | cut -f1)
        echo -e "${GREEN}✅ Feature Graphic:${NC} feature-graphic.png ($SIZE)"
    else
        echo -e "${YELLOW}❌ Feature Graphic: Fehlt! (Verwende Option 1 zum Erstellen)${NC}"
    fi

    # Screenshots
    SCREENSHOT_COUNT=$(find . -maxdepth 1 -name "screenshot-*.png" -o -name "screenshot-*.jpg" | wc -l | tr -d ' ')

    if [[ $SCREENSHOT_COUNT -ge 2 ]]; then
        echo -e "${GREEN}✅ Screenshots:${NC} $SCREENSHOT_COUNT gefunden (mind. 2 benötigt)"
        find . -maxdepth 1 \( -name "screenshot-*.png" -o -name "screenshot-*.jpg" \) -exec echo "   - {}" \;
    elif [[ $SCREENSHOT_COUNT -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Screenshots:${NC} Nur $SCREENSHOT_COUNT gefunden (mind. 2 benötigt)"
    else
        echo -e "${YELLOW}❌ Screenshots: Keine gefunden! (Verwende Option 2 zum Erstellen)${NC}"
    fi

    echo ""
    echo "Gesamtstatus:"

    if [[ -f "icon-512x512.png" ]] && [[ -f "feature-graphic.png" ]] && [[ $SCREENSHOT_COUNT -ge 2 ]]; then
        echo -e "${GREEN}✅ Bereit für Play Store Upload!${NC}"
    else
        echo -e "${YELLOW}⚠️  Noch nicht vollständig - siehe fehlende Items oben${NC}"
    fi

    echo ""
}

# Funktion: Hilfe anzeigen
show_help() {
    echo "Play Store Assets Creator"
    echo ""
    echo "Verwendung:"
    echo "  ./create-assets.sh [option]"
    echo ""
    echo "Optionen:"
    echo "  1, feature     - Feature Graphic HTML öffnen"
    echo "  2, screenshots - Web-App für Screenshots öffnen"
    echo "  3, status      - Status der Assets anzeigen"
    echo "  help           - Diese Hilfe anzeigen"
    echo ""
}

# Menü anzeigen
show_menu() {
    echo "Was möchtest du erstellen?"
    echo ""
    echo "1) Feature Graphic (1024x500px) erstellen"
    echo "2) Screenshots erstellen (Screenshot Helper - EMPFOHLEN)"
    echo "3) Screenshots erstellen (Web-App direkt)"
    echo "4) Status überprüfen"
    echo "5) Beenden"
    echo ""
    read -p "Wähle eine Option (1-5): " choice

    case $choice in
        1)
            open_feature_graphic
            ;;
        2)
            open_screenshot_helper
            ;;
        3)
            open_webapp
            ;;
        4)
            check_status
            ;;
        5)
            echo "Auf Wiedersehen!"
            exit 0
            ;;
        *)
            echo "Ungültige Auswahl!"
            ;;
    esac
}

# Hauptlogik
if [[ $# -eq 0 ]]; then
    # Kein Argument: Menü anzeigen
    show_menu
else
    # Argument vorhanden
    case $1 in
        1|feature)
            open_feature_graphic
            ;;
        2|screenshots|screenshot-helper)
            open_screenshot_helper
            ;;
        3|webapp)
            open_webapp
            ;;
        4|status)
            check_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Ungültige Option: $1"
            show_help
            exit 1
            ;;
    esac
fi
