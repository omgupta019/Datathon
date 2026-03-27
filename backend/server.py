from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import random
import bcrypt
import jwt as pyjwt
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


# --- Auth Helpers ---

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return pyjwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = pyjwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Helpers ---

def generate_wallet_id():
    return "0x" + uuid.uuid4().hex[:40]

def generate_block_hash(index, prev_hash, data):
    content = f"{index}{prev_hash}{data}"
    return hashlib.sha256(content.encode()).hexdigest()

def user_response(doc):
    return {k: v for k, v in doc.items() if k not in ("_id", "password_hash")}


# --- Pydantic Models ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    address: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class WalletConnectRequest(BaseModel):
    role: str

class OrderCreate(BaseModel):
    wallet_id: str
    type: str
    energy_kwh: float
    price_per_kwh: float


# --- Auth Endpoints ---

@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if "@" not in req.email or "." not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name.strip(),
        "address": req.address.strip(),
        "role": None,
        "wallet_id": None,
        "energy_balance": 0.0,
        "token_balance": 10000.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    return {"user": user_response(user_doc), "token": token}

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    return {"user": user_response(user), "token": token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


# --- Wallet Endpoint ---

@api_router.post("/wallet/connect")
async def connect_wallet(req: WalletConnectRequest, request: Request):
    auth_user = await get_current_user(request)
    wallet_id = generate_wallet_id()

    update_data = {
        "wallet_id": wallet_id,
        "role": req.role,
        "energy_balance": round(random.uniform(10, 80), 2) if req.role == "seller" else 0.0
    }
    await db.users.update_one({"id": auth_user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": auth_user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.get("/wallet/{wallet_id}")
async def get_wallet(wallet_id: str):
    user = await db.users.find_one({"wallet_id": wallet_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return user


# --- Order Endpoints ---

@api_router.post("/orders")
async def create_order(req: OrderCreate):
    user = await db.users.find_one({"wallet_id": req.wallet_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.energy_kwh <= 0 or req.price_per_kwh <= 0:
        raise HTTPException(status_code=400, detail="Energy and price must be positive")

    order_doc = {
        "id": str(uuid.uuid4()),
        "wallet_id": req.wallet_id,
        "user_name": user.get("name", "Unknown"),
        "type": req.type,
        "energy_kwh": round(req.energy_kwh, 4),
        "price_per_kwh": round(req.price_per_kwh, 4),
        "remaining_kwh": round(req.energy_kwh, 4),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    await db.market_prices.insert_one({
        "price": round(req.price_per_kwh, 4),
        "type": req.type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {k: v for k, v in order_doc.items() if k != "_id"}

@api_router.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type")
):
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

@api_router.get("/orders/user/{wallet_id}")
async def get_user_orders(wallet_id: str):
    orders = await db.orders.find({"wallet_id": wallet_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    result = await db.orders.update_one(
        {"id": order_id, "status": {"$in": ["active", "partially_filled"]}},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or already completed")
    return {"message": "Order cancelled"}


# --- Matching Engine ---

@api_router.post("/match")
async def run_matching():
    buy_orders = await db.orders.find(
        {"type": "buy", "status": {"$in": ["active", "partially_filled"]}, "remaining_kwh": {"$gt": 0}}
    ).sort("price_per_kwh", -1).to_list(1000)

    sell_orders = await db.orders.find(
        {"type": "sell", "status": {"$in": ["active", "partially_filled"]}, "remaining_kwh": {"$gt": 0}}
    ).sort("price_per_kwh", 1).to_list(1000)

    last_block = await db.blockchain.find_one(sort=[("index", -1)])
    block_count = last_block["index"] if last_block else 0
    prev_hash = last_block["hash"] if last_block else "0" * 64

    transactions = []

    for buy in buy_orders:
        if buy["remaining_kwh"] <= 0:
            continue
        for sell in sell_orders:
            if buy["remaining_kwh"] <= 0:
                break
            if sell["remaining_kwh"] <= 0:
                continue
            if sell["wallet_id"] == buy["wallet_id"]:
                continue
            if buy["price_per_kwh"] >= sell["price_per_kwh"]:
                trade_amount = round(min(buy["remaining_kwh"], sell["remaining_kwh"]), 4)
                trade_price = round((buy["price_per_kwh"] + sell["price_per_kwh"]) / 2, 4)
                total_cost = round(trade_amount * trade_price, 4)

                buy["remaining_kwh"] = round(buy["remaining_kwh"] - trade_amount, 4)
                sell["remaining_kwh"] = round(sell["remaining_kwh"] - trade_amount, 4)

                block_count += 1
                block_data = f"{buy['wallet_id']}{sell['wallet_id']}{trade_amount}{trade_price}{datetime.now(timezone.utc).isoformat()}"
                block_hash = generate_block_hash(block_count, prev_hash, block_data)
                timestamp = datetime.now(timezone.utc).isoformat()

                block_doc = {
                    "index": block_count,
                    "buyer_wallet": buy["wallet_id"],
                    "seller_wallet": sell["wallet_id"],
                    "buyer_name": buy.get("user_name", "Unknown"),
                    "seller_name": sell.get("user_name", "Unknown"),
                    "energy_traded": trade_amount,
                    "price": trade_price,
                    "total_cost": total_cost,
                    "timestamp": timestamp,
                    "prev_hash": prev_hash,
                    "hash": block_hash
                }
                await db.blockchain.insert_one(block_doc)
                prev_hash = block_hash

                tx_doc = {
                    "id": str(uuid.uuid4()),
                    "buyer_wallet": buy["wallet_id"],
                    "seller_wallet": sell["wallet_id"],
                    "buyer_name": buy.get("user_name", "Unknown"),
                    "seller_name": sell.get("user_name", "Unknown"),
                    "energy_kwh": trade_amount,
                    "price_per_kwh": trade_price,
                    "total_cost": total_cost,
                    "block_index": block_count,
                    "block_hash": block_hash,
                    "timestamp": timestamp
                }
                await db.transactions.insert_one(tx_doc)
                transactions.append({k: v for k, v in tx_doc.items() if k != "_id"})

                await db.market_prices.insert_one({
                    "price": trade_price, "type": "trade", "timestamp": timestamp
                })
                await db.users.update_one(
                    {"wallet_id": buy["wallet_id"]},
                    {"$inc": {"token_balance": -total_cost, "energy_balance": trade_amount}}
                )
                await db.users.update_one(
                    {"wallet_id": sell["wallet_id"]},
                    {"$inc": {"token_balance": total_cost, "energy_balance": -trade_amount}}
                )

                buy_status = "filled" if buy["remaining_kwh"] <= 0 else "partially_filled"
                sell_status = "filled" if sell["remaining_kwh"] <= 0 else "partially_filled"
                await db.orders.update_one({"id": buy["id"]}, {"$set": {"remaining_kwh": buy["remaining_kwh"], "status": buy_status}})
                await db.orders.update_one({"id": sell["id"]}, {"$set": {"remaining_kwh": sell["remaining_kwh"], "status": sell_status}})

    return {"matched": len(transactions), "transactions": transactions}


# --- Blockchain & Transactions ---

@api_router.get("/blockchain")
async def get_blockchain():
    blocks = await db.blockchain.find({}, {"_id": 0}).sort("index", -1).to_list(200)
    return blocks

@api_router.get("/transactions")
async def get_transactions(wallet_id: Optional[str] = None):
    query = {}
    if wallet_id:
        query["$or"] = [{"buyer_wallet": wallet_id}, {"seller_wallet": wallet_id}]
    txs = await db.transactions.find(query, {"_id": 0}).sort("timestamp", -1).to_list(200)
    return txs


# --- Market Stats ---

@api_router.get("/market/stats")
async def get_market_stats():
    total_orders = await db.orders.count_documents({})
    active_buy = await db.orders.count_documents({"type": "buy", "status": {"$in": ["active", "partially_filled"]}})
    active_sell = await db.orders.count_documents({"type": "sell", "status": {"$in": ["active", "partially_filled"]}})
    total_transactions = await db.transactions.count_documents({})

    pipeline = [{"$group": {"_id": None, "total_energy": {"$sum": "$energy_traded"}, "total_value": {"$sum": "$total_cost"}}}]
    agg_result = await db.blockchain.aggregate(pipeline).to_list(1)
    total_energy = agg_result[0]["total_energy"] if agg_result else 0
    total_value = agg_result[0]["total_value"] if agg_result else 0
    avg_price = round(total_value / total_energy, 2) if total_energy > 0 else 0

    total_listed_pipeline = [{"$match": {"type": "sell"}}, {"$group": {"_id": None, "total": {"$sum": "$energy_kwh"}}}]
    total_listed = await db.orders.aggregate(total_listed_pipeline).to_list(1)
    total_listed_energy = total_listed[0]["total"] if total_listed else 0
    efficiency = round((total_energy / total_listed_energy) * 100, 1) if total_listed_energy > 0 else 0

    buy_pipeline = [{"$match": {"type": "buy"}}, {"$group": {"_id": None, "total": {"$sum": "$energy_kwh"}}}]
    sell_pipeline = [{"$match": {"type": "sell"}}, {"$group": {"_id": None, "total": {"$sum": "$energy_kwh"}}}]
    buy_total = await db.orders.aggregate(buy_pipeline).to_list(1)
    sell_total = await db.orders.aggregate(sell_pipeline).to_list(1)
    total_demand = buy_total[0]["total"] if buy_total else 0
    total_supply = sell_total[0]["total"] if sell_total else 0

    sell_prices = await db.orders.find(
        {"type": "sell", "status": {"$in": ["active", "partially_filled"]}},
        {"_id": 0, "price_per_kwh": 1}
    ).to_list(100)
    suggested_bid = round(sum(s["price_per_kwh"] for s in sell_prices) / len(sell_prices) * 1.05, 2) if sell_prices else 8.0

    return {
        "total_orders": total_orders,
        "active_buy_orders": active_buy,
        "active_sell_orders": active_sell,
        "total_transactions": total_transactions,
        "total_energy_traded": round(total_energy, 2),
        "total_value": round(total_value, 2),
        "avg_price": avg_price,
        "market_efficiency": min(efficiency, 100),
        "total_demand": round(total_demand, 2),
        "total_supply": round(total_supply, 2),
        "suggested_bid_price": suggested_bid
    }

@api_router.get("/market/prices")
async def get_market_prices():
    prices = await db.market_prices.find({}, {"_id": 0}).sort("timestamp", 1).to_list(300)
    return prices

@api_router.get("/notifications/{wallet_id}")
async def get_notifications(wallet_id: str):
    notifications = []
    stats_data = await get_market_stats()

    if stats_data["total_supply"] > stats_data["total_demand"] * 1.2 and stats_data["total_supply"] > 0:
        notifications.append({"type": "info", "message": "Good time to buy! Supply exceeds demand by 20%+", "timestamp": datetime.now(timezone.utc).isoformat()})
    if stats_data["total_demand"] > stats_data["total_supply"] * 1.2 and stats_data["total_demand"] > 0:
        notifications.append({"type": "warning", "message": "High demand detected! Prices may rise.", "timestamp": datetime.now(timezone.utc).isoformat()})
    if stats_data["market_efficiency"] > 70:
        notifications.append({"type": "success", "message": f"Market efficiency at {stats_data['market_efficiency']}%!", "timestamp": datetime.now(timezone.utc).isoformat()})
    if stats_data["suggested_bid_price"] > 0 and stats_data["active_sell_orders"] > 0:
        notifications.append({"type": "info", "message": f"Suggested bid: \u20b9{stats_data['suggested_bid_price']}/kWh", "timestamp": datetime.now(timezone.utc).isoformat()})

    recent_txs = await db.transactions.find(
        {"$or": [{"buyer_wallet": wallet_id}, {"seller_wallet": wallet_id}]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(3)
    for tx in recent_txs:
        role = "Bought" if tx["buyer_wallet"] == wallet_id else "Sold"
        notifications.append({"type": "success", "message": f"{role} {tx['energy_kwh']} kWh at \u20b9{tx['price_per_kwh']}/kWh", "timestamp": tx["timestamp"]})

    return notifications

@api_router.get("/users")
async def get_users():
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users


# --- App Setup ---

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True, sparse=True)
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@voltnet.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "address": "VoltNet HQ, Mumbai",
            "role": None,
            "wallet_id": None,
            "energy_balance": 0.0,
            "token_balance": 50000.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
