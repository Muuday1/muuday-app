import json, urllib.request, os

token = os.environ.get('GITHUB_TOKEN')
if not token:
    print('No GITHUB_TOKEN found')
    exit(1)

with open('.tmp-pr-body.json', 'r', encoding='utf-8') as f:
    body = f.read()

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

data = json.dumps({
    'title': 'security(phase-3): add rate limits, CSRF origin validation, and session hardening',
    'head': 'security/phase-3-csrf-headers-and-session-hardening',
    'base': 'main',
    'body': body
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.github.com/repos/Muuday1/muuday-app/pulls',
    data=data,
    headers=headers,
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        print(f"PR #{result['number']} created: {result['html_url']}")
except urllib.error.HTTPError as e:
    err = json.loads(e.read().decode())
    print(f"Error: {e.code} - {err}")
