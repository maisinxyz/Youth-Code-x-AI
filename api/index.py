import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

from fastapi import FastAPI

from app.main import app as inner_app

app = FastAPI()
app.mount("/api", inner_app)
