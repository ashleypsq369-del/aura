"""Fix light mode body background - change from too-white to blue-gray"""
p = r'c:\xampp\htdocs\ProjectAura_React\frontend\src\index.css'
t = open(p, encoding='utf-8').read()

OLD = """body {
    /* Subtle healthcare-appropriate gradient background */
    background: linear-gradient(135deg, 
      #F0F9FF 0%,     /* Very light blue */
      #F0F4F8 25%,    /* Light blue-gray */
      #EFF6FF 50%,    /* Soft blue */
      #F0F4F8 75%,    /* Light blue-gray */
      #E0F2FE 100%    /* Light cyan */
    );
    background-attachment: fixed;
    background-size: 400% 400%;
    animation: subtleShift 30s ease infinite;
    color: var(--color-text-primary);
    font-family: var(--font-family-sans);
    min-height: 100vh;
  }"""

NEW = """body {
    /* Healthcare blue-gray -- subtle depth, not pure white */
    background: linear-gradient(160deg,
      #e8edf5 0%,
      #edf2f9 20%,
      #e5eaf3 40%,
      #edf2f9 60%,
      #e8ecf6 80%,
      #e8edf5 100%
    );
    background-attachment: fixed;
    background-size: 400% 400%;
    animation: subtleShift 45s ease infinite;
    color: var(--color-text-primary);
    font-family: var(--font-family-sans);
    min-height: 100vh;
  }"""

if OLD in t:
    t = t.replace(OLD, NEW)
    open(p, 'w', encoding='utf-8').write(t)
    print('Fixed index.css body background')
else:
    # Try normalising whitespace
    import re
    t2 = re.sub(
        r'body \{[^}]+background: linear-gradient\(135deg,[^}]+min-height: 100vh;\s*\}',
        NEW,
        t,
        flags=re.DOTALL
    )
    if t2 != t:
        open(p, 'w', encoding='utf-8').write(t2)
        print('Fixed via regex')
    else:
        print('ERROR: could not find body block to replace')
        # Show context
        i = t.find('body {')
        print(repr(t[i:i+600]))
