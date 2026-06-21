import sqlite3
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DB_PATH = Path("data/waitlist.db")

# Ensure data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

class WaitlistRequest(BaseModel):
    name: str
    email: str

class WaitlistResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str

@router.post("/join")
def join_waitlist(entry: WaitlistRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO waitlist (name, email) VALUES (?, ?)",
            (entry.name.strip(), entry.email.strip())
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    
    conn.close()
    return {"message": "Successfully joined waitlist"}

@router.get("/entries", response_model=List[WaitlistResponse])
def get_entries():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, created_at FROM waitlist ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {"id": row[0], "name": row[1], "email": row[2], "created_at": row[3]}
        for row in rows
    ]
