"""
Fix all hardcoded user profile values across every HTML page.
Removes: "AD" initials, "Loading...", "Pro Plan", "Admin User", "admin@example.com"
Replaces with empty placeholders that theme.js will populate dynamically.
"""
import re
import glob

files_modified = []

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Fix user-avatar: replace hardcoded "AD" initials with empty string
    #    Matches: <div class="user-avatar">AD</div>
    content = re.sub(
        r'(<div\s+class="user-avatar">)\s*AD\s*(</div>)',
        r'\1\2',
        content
    )
    
    # 2. Fix userNameDisplay: replace "Loading..." or "Admin" with empty string
    content = re.sub(
        r'(id="userNameDisplay">)\s*(Loading\.\.\.|Admin)\s*(</span>)',
        r'\1\3',
        content
    )
    
    # 3. Fix userNameGreeting: same treatment
    content = re.sub(
        r'(id="userNameGreeting"[^>]*>)\s*(Loading\.\.\.|Admin)\s*(</span>)',
        r'\1\3',
        content
    )
    
    # 4. Remove "Pro Plan" line entirely from navbar (the <span class="user-role">Pro Plan</span> line)
    content = re.sub(
        r'\s*<span\s+class="user-role">Pro Plan</span>\s*\n?',
        '\n',
        content
    )
    
    # 5. Fix profileName on profile.html
    content = re.sub(
        r'(id="profileName">)\s*(Loading\.\.\.|Admin User)\s*(</h4>)',
        r'\1\3',
        content
    )
    
    # 6. Fix profileEmail on profile.html
    content = re.sub(
        r'(id="profileEmail">)\s*admin@example\.com\s*(</p>)',
        r'\1\2',
        content
    )
    
    # 7. Fix large avatar "AD" on profile.html
    content = re.sub(
        r'(id="largeAvatar">)\s*\n?\s*AD\s*\n?(\s*<div class="edit-btn">)',
        r'\1\n                            \2',
        content
    )
    
    # 8. Remove "Pro Plan" badge and "Account Owner" badge from profile card
    content = re.sub(
        r'\s*<div class="d-flex justify-content-center gap-2 mb-4">\s*\n\s*<span class="badge bg-primary">Pro Plan</span>\s*\n\s*<span class="badge bg-secondary">Account Owner</span>\s*\n\s*</div>',
        '',
        content
    )
    
    # 9. Remove "Pro Plan" from settings page (subscription section) - leave it, it's a settings feature not profile display
    # Actually, settings.html line 203 is in the subscription section, not the navbar. Leave that alone.
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        files_modified.append(filepath)
        print(f"  Fixed: {filepath}")

print(f"\nTotal files modified: {len(files_modified)}")
