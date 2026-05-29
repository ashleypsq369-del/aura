"""Apply chosen navigation style to all pages"""
import os
import sys

def update_dashboard(nav_style):
    """Update Dashboard page with chosen navigation"""
    
    if nav_style == "topnav":
        import_line = "from src.topnav import setup_page"
        config_line = 'st.set_page_config(page_title="Dashboard - Project Aura", page_icon="📊", layout="wide")'
    elif nav_style == "collapsible":
        import_line = "from src.collapsible_nav import setup_page"
        config_line = 'st.set_page_config(page_title="Dashboard - Project Aura", page_icon="📊", layout="wide", initial_sidebar_state="expanded")'
    elif nav_style == "drawer":
        import_line = "from src.drawer_nav import setup_page"
        config_line = 'st.set_page_config(page_title="Dashboard - Project Aura", page_icon="📊", layout="wide")'
    else:
        print(f"❌ Unknown style: {nav_style}")
        print("   Use: topnav, collapsible, or drawer")
        return False
    
    # Read current dashboard
    with open("pages/2_Dashboard.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace import
    if "from src.shared_nav import setup_page" in content:
        content = content.replace("from src.shared_nav import setup_page", import_line)
    elif "from src.topnav import setup_page" in content:
        content = content.replace("from src.topnav import setup_page", import_line)
    elif "from src.collapsible_nav import setup_page" in content:
        content = content.replace("from src.collapsible_nav import setup_page", import_line)
    elif "from src.drawer_nav import setup_page" in content:
        content = content.replace("from src.drawer_nav import setup_page", import_line)
    else:
        print("❌ Could not find navigation import to replace")
        return False
    
    # Write back
    with open("pages/2_Dashboard.py", "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"✅ Dashboard updated with {nav_style} navigation")
    return True

if __name__ == "__main__":
    print("🎨 NAVIGATION STYLE SELECTOR")
    print("=" * 50)
    print("\nAvailable styles:")
    print("  1. topnav      - Top navigation bar (Recommended)")
    print("  2. collapsible - Collapsible sidebar")
    print("  3. drawer      - Slide-out drawer")
    print()
    
    if len(sys.argv) > 1:
        style = sys.argv[1].lower()
    else:
        style = input("Enter style (topnav/collapsible/drawer): ").lower().strip()
    
    if style in ["1", "top", "topnav"]:
        style = "topnav"
    elif style in ["2", "collapse", "collapsible", "sidebar"]:
        style = "collapsible"
    elif style in ["3", "drawer", "slide"]:
        style = "drawer"
    
    print(f"\n📝 Applying {style} navigation...")
    
    if update_dashboard(style):
        print("\n" + "=" * 50)
        print("✅ NAVIGATION UPDATED!")
        print("\n📋 Next steps:")
        print("1. Restart Streamlit: streamlit run app.py")
        print("2. Clear browser cache (Ctrl+Shift+Delete)")
        print("3. Login and test the new navigation")
        print("\n🎉 Enjoy your new navigation style!")
    else:
        print("\n❌ Update failed. Check the error above.")
