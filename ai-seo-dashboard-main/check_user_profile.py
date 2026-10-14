import glob
import re

def main():
    for f in glob.glob('*.html'):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        matches = re.findall(r'<a href="profile\.html" class="user-profile">.*?</a>', content, re.DOTALL)
        if matches:
            print(f'{f}: {len(matches)} match(es)')
        else:
            print(f'{f}: No match')

if __name__ == '__main__':
    main()
