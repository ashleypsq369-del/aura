"""Apply all final fixes to app.py"""

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove "Redirecting" message and balloons, add rerun
content = content.replace(
    'st.success("✅ Login successful! Redirecting...")\n                        st.balloons()\n                        # st.rerun() - removed for performance',
    'st.rerun()'
)

# Fix 2: Remove balloons from signup
content = content.replace(
    'st.success("✅ Account created successfully!")\n                        st.balloons()',
    'st.success("✅ Account created!")'
)

# Fix 3: Ensure signup redirects properly
content = content.replace(
    'st.info("👉 Please sign in with your new credentials")\n                        st.session_state.show_signup = False\n                        # st.rerun() - removed for performance',
    'st.session_state.show_signup = False\n                        st.rerun()'
)

# Write back
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Applied all fixes!")
print("- Removed 'Redirecting' message")
print("- Removed balloons animations")
print("- Fixed login rerun")
print("- Fixed signup rerun")
