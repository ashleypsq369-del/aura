"""Remove unnecessary st.rerun() calls for better performance"""

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Lines where we KEEP st.rerun() (authentication changes)
keep_patterns = [
    'st.session_state.authenticated = False',  # Logout
    'st.session_state.authenticated = True',   # Login
    'st.session_state.show_signup = True',     # Show signup
    'st.session_state.show_signup = False',    # Hide signup
    'st.session_state.sidebar_open = not'      # Toggle sidebar
]

lines = content.split('\n')
new_lines = []
skip_next_rerun = False

for i, line in enumerate(lines):
    # Check if this line should keep its rerun
    keep_rerun = any(pattern in line for pattern in keep_patterns)
    
    if keep_rerun:
        new_lines.append(line)
        skip_next_rerun = False
    elif 'st.rerun()' in line and not skip_next_rerun:
        # Check previous lines for keep patterns
        prev_lines = '\n'.join(lines[max(0, i-3):i])
        if any(pattern in prev_lines for pattern in keep_patterns):
            new_lines.append(line)  # Keep this rerun
        else:
            # Skip this rerun (comment it out for safety)
            new_lines.append(line.replace('st.rerun()', '# st.rerun() - removed for performance'))
    else:
        new_lines.append(line)

# Write back
with open('app.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("✅ Optimized app.py - removed unnecessary reruns")
