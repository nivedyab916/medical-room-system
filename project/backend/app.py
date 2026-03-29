from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db
import math
from datetime import datetime, timedelta
import os 

app = Flask(__name__)
CORS(app)


# ---------------- HOME ----------------
@app.route("/")
def home():
    return "Hostel Medicine Backend Running ✅"


# ---------------- STUDENTS ----------------
@app.route("/students", methods=["GET"])
def get_students():
    conn = get_db()
    data = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    return jsonify([dict(s) for s in data])


@app.route("/students", methods=["POST"])
def add_student():
    data = request.json
    conn = get_db()

    try:
        conn.execute(
            "INSERT INTO students (name, roll, room, phone) VALUES (?, ?, ?, ?)",
            (data["name"], data["roll"], data["room"], data["phone"])
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": "Student with this roll number already exists"}), 400

    conn.close()
    return jsonify({"message": "Student Added"})


@app.route("/students/<int:id>", methods=["DELETE"])
def delete_student(id):
    conn = get_db()
    conn.execute("DELETE FROM students WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Student Deleted"})


# ---------------- MEDICINES ----------------
@app.route("/medicines", methods=["GET"])
def get_medicines():
    conn = get_db()
    data = conn.execute("SELECT * FROM medicines").fetchall()
    conn.close()
    return jsonify([dict(m) for m in data])


@app.route("/medicines", methods=["POST"])
def add_medicine():
    data = request.json
    conn = get_db()

    try:
        conn.execute(
            "INSERT INTO medicines (name, qty, expiry) VALUES (?, ?, ?)",
            (data["name"], data["qty"], data["expiry"])
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": "Medicine already exists"}), 400

    conn.close()
    return jsonify({"message": "Medicine Added"})


@app.route("/medicines/<int:id>", methods=["PUT"])
def update_medicine(id):
    data = request.json
    conn = get_db()

    med = conn.execute("SELECT * FROM medicines WHERE id=?", (id,)).fetchone()

    if not med:
        conn.close()
        return jsonify({"error": "Medicine not found"}), 404

    new_qty = data.get("qty", med["qty"])
    new_expiry = data.get("expiry", med["expiry"])

    conn.execute(
        "UPDATE medicines SET qty=?, expiry=? WHERE id=?",
        (new_qty, new_expiry, id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Medicine Updated"})


@app.route("/medicines/<int:id>", methods=["DELETE"])
def delete_medicine(id):
    conn = get_db()
    conn.execute("DELETE FROM medicines WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Medicine Deleted"})


# ---------------- HISTORY ----------------
@app.route("/history", methods=["GET"])
def get_history():
    conn = get_db()
    data = conn.execute("SELECT * FROM history ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(h) for h in data])


@app.route("/history", methods=["POST"])
def add_history():
    data = request.json
    conn = get_db()

    conn.execute(
        """
        INSERT INTO history (student_name, roll, room, medicine, qty, reason, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["student_name"],
            data["roll"],
            data["room"],
            data["medicine"],
            data["qty"],
            data["reason"],
            data["date"]
        )
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "History Added"})


# ---------------- ISSUE MEDICINE ----------------
@app.route("/issue", methods=["POST"])
def issue_medicine():
    data = request.json
    conn = get_db()

    # Get medicine
    med = conn.execute(
        "SELECT * FROM medicines WHERE id=?",
        (data["medicine_id"],)
    ).fetchone()

    if not med:
        conn.close()
        return jsonify({"error": "Medicine not found"}), 404

    if med["qty"] < data["qty"]:
        conn.close()
        return jsonify({"error": "Not enough stock"}), 400

    # Reduce stock
    new_qty = med["qty"] - data["qty"]
    conn.execute(
        "UPDATE medicines SET qty=? WHERE id=?",
        (new_qty, data["medicine_id"])
    )

    # Get student
    student = conn.execute(
        "SELECT * FROM students WHERE id=?",
        (data["student_id"],)
    ).fetchone()

    if not student:
        conn.close()
        return jsonify({"error": "Student not found"}), 404

    # Save history
    conn.execute(
        """
        INSERT INTO history (student_name, roll, room, medicine, qty, reason, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student["name"],
            student["roll"],
            student["room"],
            med["name"],
            data["qty"],
            data["reason"],
            data["date"]
        )
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Medicine Issued Successfully"})


# ---------------- AI RESTOCK INSIGHTS HELPER ----------------
def get_priority(days_left, current_stock):
    if days_left is not None and days_left <= 3:
        return "Urgent"
    elif days_left is not None and days_left <= 7:
        return "Soon"
    elif current_stock <= 3:
        return "Urgent"
    elif current_stock <= 5:
        return "Soon"
    else:
        return "Safe"

# ---------------- AI RESTOCK INSIGHTS ----------------
@app.route("/api/low-stock-predictions", methods=["GET"])
def low_stock_predictions():
    conn = get_db()

    medicines = conn.execute("SELECT * FROM medicines").fetchall()
    predictions = []

    for med in medicines:
        medicine_name = med["name"]
        current_stock = med["qty"]

        # Get issue history of this medicine for last 30 days
        history_rows = conn.execute(
            """
            SELECT qty, date
            FROM history
            WHERE medicine = ?
              AND substr(date, 1, 10) >= date('now', '-30 days')
            ORDER BY date ASC
            """,
            (medicine_name,)
        ).fetchall()

        if not history_rows:
            predictions.append({
                "medicine_id": med["id"],
                "medicine_name": medicine_name,
                "current_stock": current_stock,
                "total_issued": 0,
                "active_days": 0,
                "avg_daily_usage": None,
                "predicted_days_left": None,
                "priority": get_priority(None, current_stock)
            })
            continue

        total_issued = sum(row["qty"] for row in history_rows)

        # Count unique dates only
        unique_dates = set()
        for row in history_rows:
            try:
                unique_dates.add(row["date"][:10])  # YYYY-MM-DD
            except:
                pass

        active_days = len(unique_dates)

        if active_days == 0 or total_issued == 0:
            avg_daily_usage = None
            predicted_days_left = None
        else:
            avg_daily_usage = total_issued / active_days
            predicted_days_left = current_stock / avg_daily_usage if avg_daily_usage > 0 else None

        predictions.append({
            "medicine_id": med["id"],
            "medicine_name": medicine_name,
            "current_stock": current_stock,
            "total_issued": total_issued,
            "active_days": active_days,
            "avg_daily_usage": round(avg_daily_usage) if avg_daily_usage is not None else None,
            "predicted_days_left": math.ceil(predicted_days_left) if predicted_days_left is not None else None,
            "priority": get_priority(predicted_days_left, current_stock)
        })

    conn.close()

    priority_order = {"Urgent": 0, "Soon": 1, "Safe": 2}

    predictions.sort(key=lambda x: (
        priority_order.get(x["priority"], 3),
        x["predicted_days_left"] if x["predicted_days_left"] is not None else 9999
    ))

    return jsonify(predictions)
 

# ---------------- TOP USED MEDICINES ----------------
@app.route("/top-used-medicines", methods=["GET"])
def top_used_medicines():
    conn = get_db()

    data = conn.execute("""
        SELECT medicine, SUM(qty) AS total_used
        FROM history
        GROUP BY medicine
        ORDER BY total_used DESC
        LIMIT 5
    """).fetchall()

    conn.close()

    return jsonify([dict(row) for row in data])

port = int(os.environ.get("PORT", 5000))
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)
