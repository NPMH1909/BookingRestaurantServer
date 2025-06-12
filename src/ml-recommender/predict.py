# predict.py
import sys
import json
import pickle
import pandas as pd
from surprise import Dataset, Reader
from pymongo import MongoClient

# Kết nối MongoDB
client = MongoClient("mongodb+srv://Booking:Npmh1410@cluster0.dh7r85v.mongodb.net/")
db = client["test"]
restaurants = pd.DataFrame(list(db.Restaurants.find()))

# Load model
with open("D:/SPKT/HK8/KLTN/RestaurantBooking_Server/src/ml-recommender/model.pkl", "rb") as f:
    model = pickle.load(f)

def recommend(user_id, top_n=5):
    restaurant_ids = restaurants["_id"].astype(str).tolist()

    predictions = []
    for rid in restaurant_ids:
        pred = model.predict(user_id, rid)
        predictions.append((rid, pred.est))

    # Sắp xếp theo điểm dự đoán giảm dần
    predictions.sort(key=lambda x: x[1], reverse=True)
    top_restaurant_ids = [r[0] for r in predictions[:top_n]]

    # Trả về thông tin nhà hàng tương ứng
    rec_restaurants = restaurants[restaurants["_id"].astype(str).isin(top_restaurant_ids)]
    return rec_restaurants[["name", "address", "rating"]].to_dict(orient="records")

# Nhận userId từ dòng lệnh
if __name__ == "__main__":
    input_json = sys.stdin.read()
    data = json.loads(input_json)
    user_id = data.get("userId")

    results = recommend(user_id)
    print(json.dumps(results, ensure_ascii=False))
