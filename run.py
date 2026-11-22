"""
SELENESCAPE - Launch Script
Launches the FastAPI backend and static server on port 8000.
"""

import sys
import uvicorn

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🌕 SELENESCAPE — Sustainable Lunar Mission Planner")
    print("🛰️  Starting Local Mission Operations Server...")
    print("🌐 Open Browser at: http://127.0.0.1:8000")
    print("📚 Interactive API:  http://127.0.0.1:8000/api/docs")
    print("="*70 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
