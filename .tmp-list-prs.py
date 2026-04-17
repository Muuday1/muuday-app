import json, urllib.request, os

token = os.environ.get('GITHUB_TOKEN')
headers = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github.v3+json'}
req = urllib.request.Request('https://api.github.com/repos/Muuday1/muuday-app/pulls?state=open&per_page=10', headers=headers)
with urllib.request.urlopen(req) as resp:
    prs = json.loads(resp.read().decode())
    for pr in prs:
        print(f"PR #{pr['number']}: {pr['title']} ({pr['head']['ref']})")
