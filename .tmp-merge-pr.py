import json, urllib.request, os, sys

token = os.environ.get('GITHUB_TOKEN')
pr_number = sys.argv[1]

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

url = f'https://api.github.com/repos/Muuday1/muuday-app/pulls/{pr_number}/merge'
data = json.dumps({'merge_method': 'squash'}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method='PUT')

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        print(f"Merged PR #{pr_number}: {result.get('message', 'OK')}")
except urllib.error.HTTPError as e:
    err = json.loads(e.read().decode())
    print(f"Error: {e.code} - {err}")
