"""Fix FeedbackWidget: em dashes, text colors, name field hint."""
path = "frontend/src/components/FeedbackWidget.jsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

# 1. Fix em dash in "General — Whole System"
src = src.replace("General \u2014 Whole System", "General - Whole System")

# 2. Fix name field - don't pre-fill with username, show placeholder hint instead
# Change: setNameInput(user.full_name) / setNameInput(user.username) to empty
# The placeholder already shows the name as a hint
old_name_effect = """  useEffect(() => {
    if (user?.email)      setEmail(user.email);
    if (user?.full_name)  setNameInput(user.full_name);
    else if (user?.username) setNameInput(user.username);
  }, [user]);"""

new_name_effect = """  useEffect(() => {
    if (user?.email) setEmail(user.email);
    // Don't pre-fill name - user should enter their own name
    // The placeholder shows their account name as a hint
  }, [user]);"""

src = src.replace(old_name_effect, new_name_effect)

# 3. Fix name field placeholder to be a clear hint, not pre-filled
old_placeholder = """        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        placeholder={user?.full_name ? `Name (${user.full_name})` : 'Your name (optional)'}
        style={inp}"""

new_placeholder = """        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        placeholder={user?.full_name ? `Your name (e.g. ${user.full_name})` : 'Your name — who is giving this feedback?'}
        required
        style={{ ...inp, borderColor: nameInput ? 'var(--card-border)' : '#f59e0b' }}"""

src = src.replace(old_placeholder, new_placeholder)

# 4. Fix the context card text colors - make them darker/more readable
# The "REVIEWING" label is too light (var(--text-400))
src = src.replace(
    "fontSize:10, fontWeight:700, color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px'",
    "fontSize:10, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px'"
)

# The description text at bottom of context card is too light
src = src.replace(
    "fontSize:10, color:'var(--text-400)', margin:0",
    "fontSize:11, color:'var(--text-600)', margin:0",
    1  # only the first match (in the context card)
)

# 5. Fix "What works / what doesn't" subtext - was showing curved apostrophe
src = src.replace("What works / what doesn\u2019t", "What works / what doesn't")
src = src.replace("What works / what doesn't", "What works and what doesn't")

# 6. Fix the body text being invisible - the background is light blue but text uses var() that might be too light
# Make the "What would you like to do?" text darker
src = src.replace(
    "<p style={{ fontSize:11, color:'var(--text-500)', margin:'0 0 2px' }}>What would you like to do?</p>",
    "<p style={{ fontSize:11, fontWeight:600, color:'var(--text-700)', margin:'0 0 2px' }}>What would you like to do?</p>"
)

# 7. Make menu item labels and sub-text more visible
src = src.replace(
    "fontSize:12, fontWeight:700, color:'var(--text-900)', margin:0",
    "fontSize:13, fontWeight:700, color:'#0f172a', margin:0"
)
src = src.replace(
    "fontSize:10, color:'var(--text-500)', margin:0",
    "fontSize:11, color:'#475569', margin:0"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Checks:")
print("  Em dash fixed:", "\u2014" not in src)
print("  Name pre-fill removed:", "setNameInput(user.full_name)" not in src)
print("  Placeholder hint added:", "who is giving this feedback" in src)
print("  Text color fixed:", "#0f172a" in src)
