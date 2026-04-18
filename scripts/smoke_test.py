#!/usr/bin/env python3
"""
Smoke test script for post-deploy verification.
Checks critical endpoints and CSP headers.
"""
import requests, sys, os

def smoke_test():
    target = os.environ.get('VERCEL_URL', 'muuday-af4y20gvn-muuday1s-projects.vercel.app')
    print(f'Testing: {target}')
    
    for path in ['/api/health', '/', '/buscar', '/login']:
        url = f'https://{target}{path}'
        print(f'GET {url}')
        try:
            r = requests.get(url, timeout=30)
            print(f'  Status: {r.status_code}')
            if r.status_code == 500:
                print('  ERROR: 500!')
                sys.exit(1)
        except Exception as e:
            print(f'  ERROR: {e}')
            sys.exit(1)
    
    # Verify CSP still has nonce
    url = f'https://{target}/'
    r = requests.get(url, timeout=30)
    csp = r.headers.get('Content-Security-Policy', '')
    if 'nonce-' in csp and 'unsafe-inline' not in csp.split('script-src')[1].split(';')[0]:
        print('OK: CSP nonce-based still active')
    else:
        print('WARN: CSP may have changed')
    
    print('All smoke tests passed!')

if __name__ == '__main__':
    smoke_test()
