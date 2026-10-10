import os
import sys
import webbrowser
import http.server
import socketserver
from pathlib import Path

PORT = 8000
DIRECTORY = Path(__file__).parent.resolve()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def log_message(self, format, *args):
        # Quiet logger to keep terminal clean
        pass

def find_available_port(start_port=8000, max_attempts=20):
    import socket
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def run_server():
    port = find_available_port(PORT)
    url = f"http://localhost:{port}"

    print("=" * 60)
    print("        🕯️  BLOODY MARY - WEB EDITION  🕯️")
    print("=" * 60)
    print(f"\n[+] Serving horror game from: {DIRECTORY}")
    print(f"[+] Server running at: {url}")
    print("[+] Opening your web browser automatically...")
    print("\n[!] Press Ctrl+C in this terminal to stop the server.\n")

    # Open browser automatically
    webbrowser.open(url)

    try:
        with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n[+] Candle extinguished. The ritual has ended.")
        sys.exit(0)

if __name__ == "__main__":
    run_server()
