import glob
import re
import os

html_chip = """<a href="profile.html" class="user-profile-chip" id="userProfileChip">
                    <div class="user-avatar-purple" id="userAvatarPill"></div>
                    <span class="user-name-text" id="userNamePill"></span>
                </a>"""

def main():
    modified_files = []
    
    # Files to process
    html_files = [f for f in glob.glob('*.html') if f not in ['index.html', 'login.html', 'register.html']]
    
    for f in html_files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        original = content
        
        # Replace the user-profile block
        content = re.sub(
            r'<a href="profile\.html" class="user-profile">.*?</a>', 
            html_chip, 
            content, 
            flags=re.DOTALL
        )
        
        # Add CSS link if not exists
        if 'css/user-display.css' not in content:
            content = re.sub(
                r'</head>',
                r'    <link rel="stylesheet" href="css/user-display.css">\n</head>',
                content
            )
            
        # Add JS script if not exists
        if 'js/user-display.js' not in content:
            content = re.sub(
                r'</body>',
                r'<script src="js/user-display.js"></script>\n</body>',
                content
            )
            
        if content != original:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            modified_files.append(f)
            print(f"Updated {f}")

    print(f"\nTotal files updated: {len(modified_files)}")

if __name__ == '__main__':
    main()
