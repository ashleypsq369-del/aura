"""Fix encoding issues in app.py"""

# Read the file with UTF-8 encoding
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Write it back with UTF-8 encoding
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed encoding in app.py")
